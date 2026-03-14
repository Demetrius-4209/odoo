from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.database import get_db
from app.models.models import Product, Category, StockLedger, Warehouse
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[str] = None
    unit_of_measure: str = "pcs"
    reorder_level: float = 0
    initial_stock: float = 0
    warehouse_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    unit_of_measure: Optional[str] = None
    reorder_level: Optional[float] = None

def product_to_dict(p, db):
    stock_entries = db.query(StockLedger).filter(StockLedger.product_id == p.id).all()
    total_stock = sum(s.quantity for s in stock_entries)
    return {
        "id": str(p.id),
        "name": p.name,
        "sku": p.sku,
        "category": p.category.name if p.category else None,
        "category_id": str(p.category_id) if p.category_id else None,
        "unit_of_measure": p.unit_of_measure,
        "reorder_level": p.reorder_level,
        "total_stock": total_stock,
        "stock_by_warehouse": [{"warehouse_id": str(s.warehouse_id), "quantity": s.quantity} for s in stock_entries],
        "is_low_stock": total_stock <= p.reorder_level,
        "created_at": str(p.created_at)
    }

@router.get("/")
def list_products(search: Optional[str] = None, category_id: Optional[str] = None,
                  db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Product)
    if search:
        q = q.filter((Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%")))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    return [product_to_dict(p, db) for p in q.all()]

@router.post("/")
def create_product(data: ProductCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = Product(
        id=uuid.uuid4(), name=data.name, sku=data.sku,
        category_id=uuid.UUID(data.category_id) if data.category_id else None,
        unit_of_measure=data.unit_of_measure, reorder_level=data.reorder_level
    )
    db.add(product)
    db.flush()
    if data.initial_stock > 0 and data.warehouse_id:
        stock = StockLedger(
            id=uuid.uuid4(), product_id=product.id,
            warehouse_id=uuid.UUID(data.warehouse_id), quantity=data.initial_stock
        )
        db.add(stock)
    db.commit()
    db.refresh(product)
    return product_to_dict(product, db)

@router.get("/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product, db)

@router.put("/{product_id}")
def update_product(product_id: str, data: ProductUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if data.name: product.name = data.name
    if data.category_id: product.category_id = uuid.UUID(data.category_id)
    if data.unit_of_measure: product.unit_of_measure = data.unit_of_measure
    if data.reorder_level is not None: product.reorder_level = data.reorder_level
    db.commit()
    return product_to_dict(product, db)

@router.get("/categories/all")
def list_categories(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [{"id": str(c.id), "name": c.name} for c in db.query(Category).all()]

@router.post("/categories/")
def create_category(name: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cat = Category(id=uuid.uuid4(), name=name)
    db.add(cat)
    db.commit()
    return {"id": str(cat.id), "name": cat.name}
