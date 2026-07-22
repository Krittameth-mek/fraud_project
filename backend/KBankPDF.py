import re
import io
import pdfplumber

date_pattern = re.compile(r'^\d{2}[-/]\d{2}[-/]\d{2,4}$')
time_pattern = re.compile(r'^\d{2}:\d{2}$')
num_pattern = re.compile(r'^[-+]?[\d,]+\.\d{2}$')

boundaries = [90.0, 118.0, 190.0, 280.0, 331.0, 380.0]
col_order = ["date", "time", "item", "amount", "balance", "channel", "detail"]

def get_column(x, boundaries, col_order):
    for i, boundary in enumerate(boundaries):
        if x < boundary:
            return col_order[i]
    return col_order[-1]

def parse_kbank_pdf(file_bytes: bytes, password: str = None) -> list[dict]:
    """
    รับไฟล์ PDF ในรูปแบบ Bytes และอ่านข้อมูลธุรกรรม KBank ออกมาเป็น List of Dicts
    """
    transactions = []

    # เปิด PDF จาก Memory (io.BytesIO) โดยไม่ต้องเซฟลงดิสก์
    with pdfplumber.open(io.BytesIO(file_bytes), password=password) as pdf:
        for page in pdf.pages:
            words = page.extract_words(keep_blank_chars=True, use_text_flow=True)
            if not words:
                continue

            lines_dict = {}
            for w in words:
                top_coord = w["top"]
                found = False
                for existing_top in lines_dict:
                    if abs(top_coord - existing_top) < 1.5:
                        lines_dict[existing_top].append(w)
                        found = True
                        break
                if not found:
                    lines_dict[top_coord] = [w]

            sorted_lines = []
            for top in sorted(lines_dict.keys()):
                sorted_lines.append(sorted(lines_dict[top], key=lambda x: x["x0"]))

            table_started = False

            for line_words in sorted_lines:
                current_y = line_words[0]["top"] if line_words else 0
                text_joined = " ".join([w["text"] for w in line_words]).strip()

                if not text_joined or "page" in text_joined.lower() or "หน้าที่" in text_joined:
                    continue
                if any(kw in text_joined for kw in ["วันที่", "เวลา", "รายการ", "จำนวนเงิน", "ยอดคงเหลือ"]):
                    continue

                flat_tokens = []
                for w in line_words:
                    text = w["text"].strip()
                    if text:
                        if " " in text:
                            for p in text.split():
                                flat_tokens.append({"text": p, "x0": w["x0"], "x1": w["x1"]})
                        else:
                            flat_tokens.append({"text": text, "x0": w["x0"], "x1": w["x1"]})

                if not flat_tokens:
                    continue

                first_token_text = flat_tokens[0]["text"].strip()
                has_date_inside = any(date_pattern.match(t["text"]) for t in flat_tokens)
                actual_date_token = next((t for t in flat_tokens if date_pattern.match(t["text"])), None)

                if date_pattern.match(first_token_text) or has_date_inside:
                    table_started = True
                    start_token = actual_date_token if actual_date_token else flat_tokens[0]
                    start_idx = flat_tokens.index(start_token)

                    row_data = {"date": start_token["text"], "time": "", "item": "", "amount": "", "balance": "", "channel": "", "detail": ""}
                    idx = start_idx + 1

                    if idx < len(flat_tokens) and time_pattern.match(flat_tokens[idx]["text"]):
                        row_data["time"] = flat_tokens[idx]["text"]
                        idx += 1

                    item_parts = []
                    while idx < len(flat_tokens):
                        if num_pattern.match(flat_tokens[idx]["text"]):
                            break
                        item_parts.append(flat_tokens[idx]["text"])
                        idx += 1
                    row_data["item"] = " ".join(item_parts).strip()

                    number_tokens = []
                    while idx < len(flat_tokens):
                        if num_pattern.match(flat_tokens[idx]["text"]):
                            number_tokens.append(flat_tokens[idx]["text"])
                            idx += 1
                        else:
                            break

                    if len(number_tokens) == 2:
                        row_data["amount"] = number_tokens[0]
                        row_data["balance"] = number_tokens[1]
                    elif len(number_tokens) == 1:
                        if "ยอดยกมา" in row_data["item"] or "ยกมา" in row_data["item"]:
                            row_data["balance"] = number_tokens[0]
                        else:
                            row_data["amount"] = number_tokens[0]

                    tail_tokens = flat_tokens[idx:]
                    c_parts, d_parts = [], []
                    for t in tail_tokens:
                        if t["x0"] > 535:
                            continue
                        col_type = get_column(t["x0"], boundaries, col_order)
                        if col_type == "channel":
                            c_parts.append(t["text"])
                        else:
                            d_parts.append(t["text"])

                    row_data["channel"] = " ".join(c_parts).strip()
                    row_data["detail"] = " ".join(d_parts).strip()

                    transactions.append(row_data)

                else:
                    if current_y > 750:
                        continue

                    if table_started and transactions:
                        last_txn = transactions[-1]
                        for w in line_words:
                            x = w["x0"]
                            text = w["text"].strip()
                            if not text or x < 65 or w["x1"] > 535:
                                continue

                            if num_pattern.match(text):
                                if not last_txn["amount"]:
                                    last_txn["amount"] = text
                                elif not last_txn["balance"]:
                                    last_txn["balance"] = text
                                continue

                            col = get_column(x, boundaries, col_order)
                            if col in ["date", "time", "item", "amount"]:
                                last_txn["item"] = (last_txn["item"] + " " + text).strip()
                            elif col in ["balance", "channel"]:
                                last_txn["channel"] = (last_txn["channel"] + " " + text).strip()
                            elif col == "detail":
                                last_txn["detail"] = (last_txn["detail"] + " " + text).strip()

    # Clean ข้อมูลพื้นที่ว่างเกินจำเป็น
    for txn in transactions:
        for k in txn:
            txn[k] = re.sub(r'\s+', ' ', txn[k]).strip()

    return transactions


def clean_amount(val: str) -> float:
    """แปลงข้อความจำนวนเงิน เช่น '1,250.00' ให้เป็น float 1250.00"""
    if not val:
        return 0.0
    cleaned = val.replace(',', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0