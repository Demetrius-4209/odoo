import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.database import Base
import enum

class OperationStatus(str, enum.Enum):
    DRAFT = "draft"
    WAITING = "waiting"
    READY = "ready"
    DONE = "done"
    CANCELED = "canceled"

class TransferType(str, enum.Enum):
    RECEIPT = "receipt"
    DELIVERY = "delivery"
    INTERNAL = "internal"
    ADJUSTMENT = "adjustment"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    stock_entries = relationship("StockLedger", back_populates="warehouse")

class Category(Base):
    __tablename__ = "categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    unit_of_measure = Column(String, default="pcs")
    reorder_level = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = relationship("Category", back_populates="products")
    stock_entries = relationship("StockLedger", back_populates="product")
    receipt_lines = relationship("ReceiptLine", back_populates="product")
    delivery_lines = relationship("DeliveryLine", back_populates="product")

class StockLedger(Base):
    __tablename__ = "stock_ledger"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, default=0)
    product = relationship("Product", back_populates="stock_entries")
    warehouse = relationship("Warehouse", back_populates="stock_entries")

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference = Column(String, unique=True)
    supplier = Column(String)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    status = Column(Enum(OperationStatus), default=OperationStatus.DRAFT)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    lines = relationship("ReceiptLine", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptLine(Base):
    __tablename__ = "receipt_lines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id = Column(UUID(as_uuid=True), ForeignKey("receipts.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    expected_qty = Column(Float, default=0)
    received_qty = Column(Float, default=0)
    receipt = relationship("Receipt", back_populates="lines")
    product = relationship("Product", back_populates="receipt_lines")

class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference = Column(String, unique=True)
    customer = Column(String)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    status = Column(Enum(OperationStatus), default=OperationStatus.DRAFT)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    lines = relationship("DeliveryLine", back_populates="delivery", cascade="all, delete-orphan")

class DeliveryLine(Base):
    __tablename__ = "delivery_lines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_id = Column(UUID(as_uuid=True), ForeignKey("deliveries.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    demand_qty = Column(Float, default=0)
    done_qty = Column(Float, default=0)
    delivery = relationship("Delivery", back_populates="lines")
    product = relationship("Product", back_populates="delivery_lines")

class InternalTransfer(Base):
    __tablename__ = "internal_transfers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference = Column(String, unique=True)
    from_warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    to_warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    status = Column(Enum(OperationStatus), default=OperationStatus.DRAFT)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    lines = relationship("TransferLine", back_populates="transfer", cascade="all, delete-orphan")

class TransferLine(Base):
    __tablename__ = "transfer_lines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfer_id = Column(UUID(as_uuid=True), ForeignKey("internal_transfers.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity = Column(Float, default=0)
    transfer = relationship("InternalTransfer", back_populates="lines")

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference = Column(String, unique=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    reason = Column(String, nullable=True)
    status = Column(Enum(OperationStatus), default=OperationStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    lines = relationship("AdjustmentLine", back_populates="adjustment", cascade="all, delete-orphan")

class AdjustmentLine(Base):
    __tablename__ = "adjustment_lines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adjustment_id = Column(UUID(as_uuid=True), ForeignKey("stock_adjustments.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    recorded_qty = Column(Float, default=0)
    actual_qty = Column(Float, default=0)
    adjustment = relationship("StockAdjustment", back_populates="lines")

class MoveHistory(Base):
    __tablename__ = "move_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))
    move_type = Column(Enum(TransferType))
    quantity_change = Column(Float)
    reference = Column(String)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
