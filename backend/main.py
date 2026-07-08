from fastapi import FastAPI, UploadFile, File
import pandas as pd
import io

# 1. ประกาศตัวแปรสร้างระบบแอปพลิเคชัน FastAPI
app = FastAPI(title="ระบบตรวจจับความผิดปกติทางบัญชีสำหรับ SME")

# 2. สร้าง "ประตูรับข้อมูล" (Endpoint) แบบ POST สำหรับรับไฟล์ 2 ใบ
@app.post("/upload-files")
async def upload_files(
    bank_statement: UploadFile = File(...),   # รับไฟล์สเตทเมนต์ธนาคาร
    internal_ledger: UploadFile = File(...)   # รับไฟล์สมุดบัญชีภายในบริษัท
):
    try:
        # --- [ฝั่งที่ 1: อ่านไฟล์ Bank Statement] ---
        # อ่านข้อมูลจากไฟล์ที่ส่งมา (แปลงเป็น Byte stream เพื่อให้ Pandas อ่านได้)
        bank_bytes = await bank_statement.read()
        
        # ตรวจสอบว่าเป็นไฟล์ Excel หรือ CSV แล้วใช้คำสั่งอ่านให้ถูกประเภท
        if bank_statement.filename.endswith('.csv'):
            df_bank = pd.read_csv(io.BytesIO(bank_bytes))
        else:
            df_bank = pd.read_excel(io.BytesIO(bank_bytes))

        # แก้ปัญหาที่กฤตเมธเจอ: ยอดเงินฝาก-ถอนเหลื่อมคอลัมน์กัน
        # สมมติตารางมีคอลัมน์ชื่อ 'withdrawal' (ถอน) และ 'deposit' (ฝาก)
        # เราจะแปลงค่าว่าง (NaN) ให้เป็นเลข 0 ก่อน
        if 'withdrawal' in df_bank.columns and 'deposit' in df_bank.columns:
            df_bank['withdrawal'] = df_bank['withdrawal'].fillna(0)
            df_bank['deposit'] = df_bank['deposit'].fillna(0)
            
            # รวมคอลัมน์: เงินเข้าเป็นบวก (+) เงินออกเป็นลบ (-)
            df_bank['amount'] = df_bank['deposit'] - df_bank['withdrawal']


        # --- [ฝั่งที่ 2: อ่านไฟล์ บัญชีภายใน] ---
        internal_bytes = await internal_ledger.read()
        if internal_ledger.filename.endswith('.csv'):
            df_internal = pd.read_csv(io.BytesIO(internal_bytes))
        else:
            df_internal = pd.read_excel(io.BytesIO(internal_bytes))

        # รวมคอลัมน์เงินเข้า-ออกของบัญชีภายในเช่นกัน (สมมติชื่อคอลัมน์ amount_in และ amount_out)
        if 'amount_in' in df_internal.columns and 'amount_out' in df_internal.columns:
            df_internal['amount_in'] = df_internal['amount_in'].fillna(0)
            df_internal['amount_out'] = df_internal['amount_out'].fillna(0)
            df_internal['amount'] = df_internal['amount_in'] - df_internal['amount_out']


        # 3. ส่งผลลัพธ์กลับไปบอกหน้าบ้าน (หรือผู้ใช้งาน) เพื่อเช็กความถูกต้องเบื้องต้น
        return {
            "status": "success",
            "message": "ระบบได้รับไฟล์และจัดฟอร์แมตเรียบร้อยแล้ว!",
            "bank_file_name": bank_statement.filename,
            "bank_columns": df_bank.columns.tolist(),  # รายชื่อหัวข้อคอลัมน์ของสเตทเมนต์
            "internal_file_name": internal_ledger.filename,
            "internal_columns": df_internal.columns.tolist(), # รายชื่อหัวข้อคอลัมน์ของบัญชีภายใน
            # ขอลองดูตัวอย่างข้อมูลที่รวมคอลัมน์แล้ว 3 แถวแรก
            "bank_preview_amount": df_bank['amount'].head(3).tolist() if 'amount' in df_bank.columns else "ไม่พบข้อมูลเงิน"
        }

    except Exception as e:
        # หากเกิดข้อผิดพลาด (เช่น ไฟล์พัง หรือคอลัมน์ไม่ตรง) ให้แจ้งเตือนกลับไป
        return {"status": "error", "message": f"เกิดข้อผิดพลาดในการประมวลผล: {str(e)}"}