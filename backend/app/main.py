from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, products, receipts, deliveries, transfers, adjustments, dashboard, warehouses
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CoreInventory API",
    description="Modular Inventory Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["Receipts"])
app.include_router(deliveries.router, prefix="/api/deliveries", tags=["Deliveries"])
app.include_router(transfers.router, prefix="/api/transfers", tags=["Transfers"])
app.include_router(adjustments.router, prefix="/api/adjustments", tags=["Adjustments"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(warehouses.router, prefix="/api/warehouses", tags=["Warehouses"])

@app.get("/")
def root():
    return {"message": "CoreInventory API is running", "docs": "/docs"}
