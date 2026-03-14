from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.database import get_db
from app.models.models import InternalTransfer, TransferLine, StockLedger, MoveHistory, OperationStatus, TransferType
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class TransferLineIn(BaseModel):
    product_id: str
    quantity: float

class TransferCreate(BaseModel):
    from_warehouse_id: str
    to_warehouse_id: str
    notes: Optional[str] = None
    lines: List[TransferLineIn] = []

def transfer_to_dict(t, db):
    lines = []
    for l in t.lines:
        from app.models.models import Product
        prod = db.query(Product).filter(Product.id == l.product_id).first()
        lines.append({"id": str(l.id), "product_id": str(l.product_id),
                      "product_name": prod.name if prod else "", "quantity": l.quantity})
    return {
        "id": str(t.id), "reference": t.reference,
        "from_warehouse_id": str(t.from_warehouse_id),
        "to_warehouse_id": str(t.to_warehouse_id),
        "status": t.status, "notes": t.notes, "lines": lines,
        "created_at": str(t.created_at)
    }

@router.get("/")
def list_transfers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [transfer_to_dict(t, db) for t in db.query(InternalTransfer).order_by(InternalTransfer.created_at.desc()).all()]

@router.post("/")
def create_transfer(data: TransferCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = InternalTransfer(
        id=uuid.uuid4(), reference=f"INT-{uuid.uuid4().hex[:8].upper()}",
        from_warehouse_id=uuid.UUID(data.from_warehouse_id),
        to_warehouse_id=uuid.UUID(data.to_warehouse_id),
        notes=data.notes, status=OperationStatus.DRAFT
    )
    db.add(t)
    db.flush()
    for line in data.lines:
        db.add(TransferLine(id=uuid.uuid4(), transfer_id=t.id,
                            product_id=uuid.UUID(line.product_id), quantity=line.quantity))
    db.commit()
    db.refresh(t)
    return transfer_to_dict(t, db)

@router.post("/{transfer_id}/validate")
def validate_transfer(transfer_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(InternalTransfer).filter(InternalTransfer.id == transfer_id).first()
    if not t: raise HTTPException(404, "Transfer not found")
    if t.status == OperationStatus.DONE: raise HTTPException(400, "Already done")
    for line in t.lines:
        from_stock = db.query(StockLedger).filter(
            StockLedger.product_id == line.product_id, StockLedger.warehouse_id == t.from_warehouse_id).first()
        if not from_stock or from_stock.quantity < line.quantity:
            raise HTTPException(400, "Insufficient stock")
        from_stock.quantity -= line.quantity
        to_stock = db.query(StockLedger).filter(
            StockLedger.product_id == line.product_id, StockLedger.warehouse_id == t.to_warehouse_id).first()
        if to_stock:
            to_stock.quantity += line.quantity
        else:
            db.add(StockLedger(id=uuid.uuid4(), product_id=line.product_id,
                               warehouse_id=t.to_warehouse_id, quantity=line.quantity))
        db.add(MoveHistory(id=uuid.uuid4(), product_id=line.product_id, warehouse_id=t.from_warehouse_id,
                           move_type=TransferType.INTERNAL, quantity_change=-line.quantity, reference=t.reference))
    t.status = OperationStatus.DONE
    t.validated_at = datetime.utcnow()
    db.commit()
    return transfer_to_dict(t, db)
