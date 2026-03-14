from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.database import get_db
from app.models.models import Receipt, ReceiptLine, StockLedger, MoveHistory, OperationStatus, TransferType
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class ReceiptLineIn(BaseModel):
    product_id: str
    expected_qty: float
    received_qty: float = 0

class ReceiptCreate(BaseModel):
    supplier: str
    warehouse_id: str
    notes: Optional[str] = None
    lines: List[ReceiptLineIn] = []

def receipt_to_dict(r, db):
    lines = []
    for l in r.lines:
        from app.models.models import Product
        prod = db.query(Product).filter(Product.id == l.product_id).first()
        lines.append({
            "id": str(l.id), "product_id": str(l.product_id),
            "product_name": prod.name if prod else "",
            "product_sku": prod.sku if prod else "",
            "expected_qty": l.expected_qty, "received_qty": l.received_qty
        })
    return {
        "id": str(r.id), "reference": r.reference, "supplier": r.supplier,
        "warehouse_id": str(r.warehouse_id), "status": r.status,
        "notes": r.notes, "lines": lines,
        "created_at": str(r.created_at),
        "validated_at": str(r.validated_at) if r.validated_at else None
    }

def gen_ref(prefix): return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

@router.get("/")
def list_receipts(status: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Receipt)
    if status:
        q = q.filter(Receipt.status == status)
    return [receipt_to_dict(r, db) for r in q.order_by(Receipt.created_at.desc()).all()]

@router.post("/")
def create_receipt(data: ReceiptCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    receipt = Receipt(
        id=uuid.uuid4(), reference=gen_ref("REC"),
        supplier=data.supplier, warehouse_id=uuid.UUID(data.warehouse_id),
        notes=data.notes, status=OperationStatus.DRAFT
    )
    db.add(receipt)
    db.flush()
    for line in data.lines:
        db.add(ReceiptLine(
            id=uuid.uuid4(), receipt_id=receipt.id,
            product_id=uuid.UUID(line.product_id),
            expected_qty=line.expected_qty, received_qty=line.received_qty
        ))
    db.commit()
    db.refresh(receipt)
    return receipt_to_dict(receipt, db)

@router.get("/{receipt_id}")
def get_receipt(receipt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not r: raise HTTPException(404, "Receipt not found")
    return receipt_to_dict(r, db)

@router.post("/{receipt_id}/validate")
def validate_receipt(receipt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not r: raise HTTPException(404, "Receipt not found")
    if r.status == OperationStatus.DONE:
        raise HTTPException(400, "Already validated")
    for line in r.lines:
        qty = line.received_qty if line.received_qty > 0 else line.expected_qty
        stock = db.query(StockLedger).filter(
            StockLedger.product_id == line.product_id,
            StockLedger.warehouse_id == r.warehouse_id
        ).first()
        if stock:
            stock.quantity += qty
        else:
            db.add(StockLedger(id=uuid.uuid4(), product_id=line.product_id, warehouse_id=r.warehouse_id, quantity=qty))
        db.add(MoveHistory(
            id=uuid.uuid4(), product_id=line.product_id, warehouse_id=r.warehouse_id,
            move_type=TransferType.RECEIPT, quantity_change=qty,
            reference=r.reference, note=f"Receipt from {r.supplier}"
        ))
    r.status = OperationStatus.DONE
    r.validated_at = datetime.utcnow()
    db.commit()
    return receipt_to_dict(r, db)

@router.delete("/{receipt_id}")
def cancel_receipt(receipt_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not r: raise HTTPException(404, "Receipt not found")
    r.status = OperationStatus.CANCELED
    db.commit()
    return {"message": "Canceled"}
