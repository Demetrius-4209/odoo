from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.database import get_db
from app.models.models import Delivery, DeliveryLine, StockLedger, MoveHistory, OperationStatus, TransferType
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class DeliveryLineIn(BaseModel):
    product_id: str
    demand_qty: float
    done_qty: float = 0

class DeliveryCreate(BaseModel):
    customer: str
    warehouse_id: str
    notes: Optional[str] = None
    lines: List[DeliveryLineIn] = []

def delivery_to_dict(d, db):
    lines = []
    for l in d.lines:
        from app.models.models import Product
        prod = db.query(Product).filter(Product.id == l.product_id).first()
        lines.append({
            "id": str(l.id), "product_id": str(l.product_id),
            "product_name": prod.name if prod else "",
            "product_sku": prod.sku if prod else "",
            "demand_qty": l.demand_qty, "done_qty": l.done_qty
        })
    return {
        "id": str(d.id), "reference": d.reference, "customer": d.customer,
        "warehouse_id": str(d.warehouse_id), "status": d.status,
        "notes": d.notes, "lines": lines,
        "created_at": str(d.created_at),
        "validated_at": str(d.validated_at) if d.validated_at else None
    }

def gen_ref(): return f"DEL-{uuid.uuid4().hex[:8].upper()}"

@router.get("/")
def list_deliveries(status: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Delivery)
    if status: q = q.filter(Delivery.status == status)
    return [delivery_to_dict(d, db) for d in q.order_by(Delivery.created_at.desc()).all()]

@router.post("/")
def create_delivery(data: DeliveryCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    delivery = Delivery(
        id=uuid.uuid4(), reference=gen_ref(),
        customer=data.customer, warehouse_id=uuid.UUID(data.warehouse_id),
        notes=data.notes, status=OperationStatus.READY
    )
    db.add(delivery)
    db.flush()
    for line in data.lines:
        db.add(DeliveryLine(
            id=uuid.uuid4(), delivery_id=delivery.id,
            product_id=uuid.UUID(line.product_id),
            demand_qty=line.demand_qty, done_qty=line.done_qty
        ))
    db.commit()
    db.refresh(delivery)
    return delivery_to_dict(delivery, db)

@router.get("/{delivery_id}")
def get_delivery(delivery_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not d: raise HTTPException(404, "Delivery not found")
    return delivery_to_dict(d, db)

@router.post("/{delivery_id}/validate")
def validate_delivery(delivery_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not d: raise HTTPException(404, "Delivery not found")
    if d.status == OperationStatus.DONE: raise HTTPException(400, "Already validated")
    for line in d.lines:
        qty = line.done_qty if line.done_qty > 0 else line.demand_qty
        stock = db.query(StockLedger).filter(
            StockLedger.product_id == line.product_id,
            StockLedger.warehouse_id == d.warehouse_id
        ).first()
        if not stock or stock.quantity < qty:
            raise HTTPException(400, f"Insufficient stock for product")
        stock.quantity -= qty
        db.add(MoveHistory(
            id=uuid.uuid4(), product_id=line.product_id, warehouse_id=d.warehouse_id,
            move_type=TransferType.DELIVERY, quantity_change=-qty,
            reference=d.reference, note=f"Delivery to {d.customer}"
        ))
    d.status = OperationStatus.DONE
    d.validated_at = datetime.utcnow()
    db.commit()
    return delivery_to_dict(d, db)
