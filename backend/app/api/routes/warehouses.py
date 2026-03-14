from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.models.models import Warehouse
from app.core.deps import get_current_user
import uuid

router = APIRouter()

class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None

@router.get("/")
def list_warehouses(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [{"id": str(w.id), "name": w.name, "location": w.location} for w in db.query(Warehouse).all()]

@router.post("/")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = Warehouse(id=uuid.uuid4(), name=data.name, location=data.location)
    db.add(w)
    db.commit()
    db.refresh(w)
    return {"id": str(w.id), "name": w.name, "location": w.location}

@router.put("/{warehouse_id}")
def update_warehouse(warehouse_id: str, data: WarehouseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w: raise HTTPException(404, "Warehouse not found")
    w.name = data.name
    w.location = data.location
    db.commit()
    return {"id": str(w.id), "name": w.name, "location": w.location}

@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w: raise HTTPException(404, "Warehouse not found")
    db.delete(w)
    db.commit()
    return {"message": "Deleted"}
