from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. กำหนดชื่อไฟล์ SQLite (จะถูกสร้างอัตโนมัติเมื่อรันโปรแกรม)
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

# 2. สร้าง Engine สำหรับต่อ DB
# connect_args={"check_same_thread": False} จำเป็นต้องใส่สำหรับ SQLite ใน FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. สร้าง SessionLocal เอาไว้เรียกเปิด-ปิดการอ่าน/เขียน DB ในแต่ละ Request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. สร้าง Base Class ให้ Model ต่างๆ เอาไปใช้สืบทอด (Inherit)
Base = declarative_base()

# Helper function สำหรับดึง DB Session ใน FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()