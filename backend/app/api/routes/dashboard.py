from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Product, StockLedger, Receipt, Delivery, InternalTransfer, MoveHistory, OperationStatus
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    all_products = db.query(Product).all()
    total_products = len(all_products)
    
    low_stock = 0
    out_of_stock = 0
    for p in all_products:
        total_qty = sum(s.quantity for s in db.query(StockLedger).filter(StockLedger.product_id == p.id).all())
        if total_qty == 0:
            out_of_stock += 1
        elif total_qty <= p.reorder_level:
            low_stock += 1

    pending_receipts = db.query(Receipt).filter(Receipt.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY])).count()
    pending_deliveries = db.query(Delivery).filter(Delivery.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY])).count()
    pending_transfers = db.query(InternalTransfer).filter(InternalTransfer.status.in_([OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY])).count()

    recent_moves = db.query(MoveHistory).order_by(MoveHistory.created_at.desc()).limit(10).all()
    moves = []
    for m in recent_moves:
        prod = next((p for p in all_products if p.id == m.product_id), None)
        moves.append({
            "id": str(m.id), "product_name": prod.name if prod else "Unknown",
            "move_type": m.move_type, "quantity_change": m.quantity_change,
            "reference": m.reference, "created_at": str(m.created_at)
        })

    return {
        "kpis": {
            "total_products": total_products,
            "low_stock_items": low_stock,
            "out_of_stock_items": out_of_stock,
            "pending_receipts": pending_receipts,
            "pending_deliveries": pending_deliveries,
            "pending_transfers": pending_transfers,
        },
        "recent_moves": moves
    }
