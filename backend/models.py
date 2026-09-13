from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
try:
    from .database import Base
except ImportError:
    from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

# 4. ตารางเก็บกระบวนการประมวลผล (Process)
class Process(Base):
    __tablename__ = "processes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, default="default_sme", index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending|running|finished
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    # Map the existing database column without using SQLAlchemy's reserved attribute name.
    process_metadata = Column("metadata", String, nullable=True)

# 1. ตารางเก็บประวัติการอัปโหลดไฟล์
class UploadLog(Base):
    __tablename__ = "upload_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_sme", index=True) # 👈 เพิ่มตัวนี้ไว้ก่อน!
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    statements = relationship("StatementEntry", back_populates="upload_log")
    ledgers = relationship("LedgerEntry", back_populates="upload_log")


# 2. ตารางเก็บรายการ Bank Statement (จาก PDF/Excel ธนาคาร)
class StatementEntry(Base):
    __tablename__ = "statement_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)        # วันที่ใน Statement (เช่น "2026-07-01")
    description = Column(String)             # รายการ / คำอธิบาย
    amount = Column(Float, nullable=False)   # จำนวนเงิน (ฝากเป็น +, ถอนเป็น -)
    balance = Column(Float, nullable=True)   # ยอดคงเหลือ
    upload_id = Column(Integer, ForeignKey("upload_logs.id"))

    upload_log = relationship("UploadLog", back_populates="statements")


# 3. ตารางเก็บรายการ บัญชีภายใน (จาก Excel ของร้าน)
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)        # วันที่บันทึกบัญชี
    description = Column(String)             # รายการรับ-จ่าย
    amount = Column(Float, nullable=False)   # จำนวนเงิน
    category = Column(String, nullable=True) # หมวดหมู่บัญชี (ถ้ามี)
    upload_id = Column(Integer, ForeignKey("upload_logs.id"))

    upload_log = relationship("UploadLog", back_populates="ledgers")