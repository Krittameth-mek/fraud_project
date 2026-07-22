from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

import database
import models
from KBankPDF import parse_kbank_pdf, clean_amount

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

@app.post("/api/upload/statement")
async def upload_statement(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    db: Session = Depends(database.get_db)
):
    # 1. ตรวจสอบประเภทไฟล์
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="รองรับเฉพาะไฟล์ PDF เท่านั้น"
        )

    try:
        # 2. อ่านไฟล์เป็น Bytes
        file_bytes = await file.read()

        # 3. ส่งไปอ่านข้อมูลผ่าน Parser
        raw_transactions = parse_kbank_pdf(file_bytes, password=password)

        if not raw_transactions:
            return {"status": "warning", "message": "ไม่พบรายการธุรกรรมในไฟล์", "inserted_count": 0}

        # 4. บันทึก Log การอัปโหลด
        upload_log = models.UploadLog(
            filename=file.filename,
            file_type="bank_statement"
        )
        db.add(upload_log)
        db.commit()
        db.refresh(upload_log)

        # 5. แปลงข้อมูลแล้วเพิ่มลงตาราง StatementEntry
        db_entries = []
        for txn in raw_transactions:
            # รวม รายการ + ช่องทาง + รายละเอียด เข้าด้วยกันเป็น description
            desc_components = [txn["item"], txn["channel"], txn["detail"]]
            full_description = " | ".join([c for c in desc_components if c])

            entry = models.StatementEntry(
                date=txn["date"],
                description=full_description,
                amount=clean_amount(txn["amount"]),
                balance=clean_amount(txn["balance"]),
                upload_id=upload_log.id
            )
            db_entries.append(entry)

        db.bulk_save_objects(db_entries)
        db.commit()

        return {
            "status": "success",
            "upload_id": upload_log.id,
            "filename": file.filename,
            "inserted_count": len(db_entries)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการประมวลผลไฟล์: {str(e)}"
        )