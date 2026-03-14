from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.database import get_db
from app.models.models import StockAdjustment, AdjustmentLine, StockLedger, MoveHistory, OperationStatus, TransferType
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class AdjLineIn(BaseModel):
    product_id: str
    recorded_qty: float
    actual_qty: float

class AdjCreate(BaseModel):
    warehouse_id: str
    reason: Optional[str] = None
    lines: List[AdjLineIn] = []

def adj_to_dict(a, db):
    lines = []
    for l in a.lines:
        from app.models.models import Product
        prod = db.query(Product).filter(Product.id == l.product_id).first()
        lines.append({"id": str(l.id), "product_id": str(l.product_id),
                      "product_name": prod.name if prod else "",
                      "recorded_qty": l.recorded_qty, "actual_qty": l.actual_qty,
                      "difference": l.actual_qty - l.recorded_qty})
    return {"id": str(a.id), "reference": a.reference, "warehouse_id": str(a.warehouse_id),
            "reason": a.reason, "status": a.status, "lines": lines, "created_at": str(a.created_at)}

@router.get("/")
def list_adjustments(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [adj_to_dict(a, db) for a in db.query(StockAdjustment).order_by(StockAdjustment.created_at.desc()).all()]

@router.post("/")
def create_adjustment(data: AdjCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = StockAdjustment(id=uuid.uuid4(), reference=f"ADJ-{uuid.uuid4().hex[:8].upper()}",
                        warehouse_id=uuid.UUID(data.warehouse_id), reason=data.reason, status=OperationStatus.DRAFT)
    db.add(a)
    db.flush()
    for line in data.lines:
        db.add(AdjustmentLine(id=uuid.uuid4(), adjustment_id=a.id,
                              product_id=uuid.UUID(line.product_id),
                              recorded_qty=line.recorded_qty, actual_qty=line.actual_qty))
    db.commit()
    db.refresh(a)
    return adj_to_dict(a, db)

@router.post("/{adj_id}/validate")
def validate_adjustment(adj_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(StockAdjustment).filter(StockAdjustment.id == adj_id).first()
    if not a: raise HTTPException(404, "Adjustment not found")
    if a.status == OperationStatus.DONE: raise HTTPException(400, "Already validated")
    for line in a.lines:
        diff = line.actual_qty - line.recorded_qty
        stock = db.query(StockLedger).filter(
            StockLedger.product_id == line.product_id, StockLedger.warehouse_id == a.warehouse_id).first()
        if stock:
            stock.quantity = line.actual_qty
        else:
            db.add(StockLedger(id=uuid.uuid4(), product_id=line.product_id,
                               warehouse_id=a.warehouse_id, quantity=line.actual_qty))
        db.add(MoveHistory(id=uuid.uuid4(), product_id=line.product_id, warehouse_id=a.warehouse_id,
                           move_type=TransferType.ADJUSTMENT, quantity_change=diff,
                           reference=a.reference, note=a.reason))
    a.status = OperationStatus.DONE
    a.validated_at = datetime.utcnow()
    db.commit()
    return adj_to_dict(a, db)
