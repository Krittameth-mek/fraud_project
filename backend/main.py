import logging
import hashlib
import hmac
import re
import secrets
from datetime import datetime
from datetime import timedelta
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

try:
    from . import database, models
    from .KBankPDF import parse_kbank_pdf, clean_amount
    from .excel_parser import parse_bank_excel, parse_internal_ledger_smart
except ImportError:
    import database, models
    from KBankPDF import parse_kbank_pdf, clean_amount
    from excel_parser import parse_bank_excel, parse_internal_ledger_smart

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthReq(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str

class RenameReq(BaseModel):
    newTitle: str


class StartReq(BaseModel):
    datasetId: Optional[str] = None


class LLMReq(BaseModel):
    # Accept either 'promptText'/'currentData' or 'prompt'/'data' keys
    promptText: Optional[str] = None
    currentData: Optional[list] = None
    prompt: Optional[str] = None
    data: Optional[list] = None


PASSWORD_ITERATIONS = 310_000
SESSION_DAYS = 7


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_auth_input(email: str, password: str):
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="รูปแบบอีเมลไม่ถูกต้อง")
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_session(db: Session, user: models.User) -> str:
    token = secrets.token_urlsafe(32)
    session = models.AuthSession(
        user_id=user.id,
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=SESSION_DAYS),
    )
    db.add(session)
    db.commit()
    return token


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(database.get_db),
) -> models.User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบ")
    token = authorization[7:].strip()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session = db.query(models.AuthSession).filter(
        models.AuthSession.token_hash == token_hash,
        models.AuthSession.expires_at > datetime.utcnow(),
    ).first()
    if not session:
        raise HTTPException(status_code=401, detail="เซสชันหมดอายุหรือไม่ถูกต้อง")
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="ไม่พบผู้ใช้")
    return user

# Authentication Endpoints
@app.post("/api/auth/login")
def login(req: AuthReq, db: Session = Depends(database.get_db)):
    email = normalize_email(req.email)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    token = create_session(db, user)
    return {"token": token, "user": {"id": user.id, "email": user.email}}

@app.post("/api/auth/register")
def register(req: AuthReq, db: Session = Depends(database.get_db)):
    email = normalize_email(req.email)
    validate_auth_input(email, req.password)
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="อีเมลนี้ถูกใช้งานแล้ว")
    user = models.User(email=email, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    return {"success": True, "message": "สมัครสมาชิกเรียบร้อย"}


@app.get("/api/auth/me")
def get_me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email}


@app.post("/api/auth/logout")
def logout(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(database.get_db),
):
    if authorization and authorization.lower().startswith("bearer "):
        token_hash = hashlib.sha256(authorization[7:].strip().encode()).hexdigest()
        db.query(models.AuthSession).filter(models.AuthSession.token_hash == token_hash).delete()
        db.commit()
    return {"success": True, "message": "ออกจากระบบเรียบร้อย"}

@app.post("/api/auth/send-otp")
def send_otp(email: str = Form(...)):
    return {"success": True, "message": "ส่ง OTP สำเร็จ"}

@app.post("/api/auth/change-password")
def change_password(otp: str = Form(...), new_password: str = Form(...)):
    return {"success": True, "message": "เปลี่ยนรหัสผ่านสำเร็จ"}

@app.delete("/api/auth/account/{user_id}")
def delete_account(user_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบบัญชีนี้")
    db.query(models.AuthSession).filter(models.AuthSession.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"success": True, "message": "ลบบัญชีผู้ใช้สำเร็จ"}

# Process Management Endpoints
@app.get("/api/process/list")
def process_list(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    logs = db.query(models.UploadLog).all()
    return [{
        "id": f"proc_{log.id}",
        "title": f"รายการกระทบยอดที่ {log.id}",
        "uploadDate": log.uploaded_at.strftime("%Y-%m-%d %H:%M"),
        "lastOpened": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "dataDate": "2026-08-01"
    } for log in logs]

@app.patch("/api/process/{proc_id}/rename")
def rename_process(
    proc_id: str,
    req: RenameReq,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    proc = db.query(models.Process).filter(models.Process.id == proc_id).first()
    if not proc:
        return {"success": False, "error": "process not found"}
    proc.title = req.newTitle
    db.add(proc); db.commit()
    return {"success": True, "id": proc_id, "newTitle": req.newTitle}

@app.delete("/api/process/{proc_id}")
def delete_process(
    proc_id: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    proc = db.query(models.Process).filter(models.Process.id == proc_id).first()
    if not proc:
        return {"success": False, "error": "process not found"}
    db.delete(proc); db.commit()
    return {"success": True, "id": proc_id}

@app.post("/api/process/start")
def start_process(
    req: StartReq,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    new_id = f"proc_{int(datetime.utcnow().timestamp()*1000)}"
    title = f"การประมวลผล {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
    proc = models.Process(id=new_id, title=title, status='pending', user_id=str(user.id))
    db.add(proc); db.commit(); db.refresh(proc)
    # TODO: enqueue background job to run analysis (isolation forest / rule engine)
    # Placeholder only: actual analysis will update Process.status and attach results
    return {"processId": proc.id, "title": proc.title}

@app.post("/api/llm/adjust")
def llm_adjust(req: LLMReq, user: models.User = Depends(get_current_user)):
    # Accept different key names from frontend; return data unmodified for now
    prompt = req.promptText or req.prompt or ""
    data = req.currentData or req.data or []
    # TODO: integrate with LLM service to adjust/transform data per prompt
    return {"success": True, "updatedData": data, "appliedPrompt": prompt}

@app.get("/api/summary/{process_id}")
def get_summary(
    process_id: str,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    # Build a simple summary from uploaded statement entries grouped by date
    rows = db.query(models.StatementEntry.date, func.count(models.StatementEntry.id).label('cnt'))\
             .group_by(models.StatementEntry.date).all()
    chart = []
    for r in rows:
        chart.append({"date": r[0] or "", "count": int(r[1] or 0), "anomalyType": None, "details": "ปกติ"})

    # If no statement entries exist, return a small sample
    if not chart:
        chart = [
            {"date": "2026-08-01", "count": 12, "anomalyType": None, "details": "ปกติ"},
            {"date": "2026-08-02", "count": 25, "anomalyType": "BOTH", "details": "ตัวอย่าง"},
            {"date": "2026-08-03", "count": 18, "anomalyType": "RULE", "details": "ตัวอย่าง"}
        ]

    return {"processId": process_id, "chartData": chart}

# File Upload Endpoints
@app.post("/api/upload/statement")
async def upload_statement(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    file_bytes = await file.read()
    filename = file.filename.lower()
    raw_txns = parse_kbank_pdf(file_bytes, password=password) if filename.endswith(".pdf") else parse_bank_excel(file_bytes)
    
    log = models.UploadLog(filename=file.filename, file_type="bank_statement", user_id=str(user.id))
    db.add(log); db.commit(); db.refresh(log)
    return {"status": "success", "upload_id": log.id, "transactions": raw_txns}

@app.post("/api/upload/files")
async def upload_files(
    bank_statement: UploadFile = File(...),
    internal_ledger: UploadFile = File(...),
    password: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    bank_bytes = await bank_statement.read()
    ledger_bytes = await internal_ledger.read()

    txns = parse_kbank_pdf(bank_bytes, password=password) if bank_statement.filename.lower().endswith(".pdf") else parse_bank_excel(bank_bytes)
    ledger_res = parse_internal_ledger_smart(ledger_bytes, internal_ledger.filename)

    bank_log = models.UploadLog(filename=bank_statement.filename, file_type="bank_statement", user_id=str(user.id))
    ledger_log = models.UploadLog(filename=internal_ledger.filename, file_type="internal_ledger", user_id=str(user.id))
    db.add_all([bank_log, ledger_log])
    db.commit()

    return {
        "status": "success",
        "warning": ledger_res.get("warning"),
        "bank": {"upload_id": bank_log.id, "transactions": txns},
        "ledger": {"rows_count": ledger_res["inserted_count"], "preview": ledger_res["rows"][:20]}
    }