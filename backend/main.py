from fastapi import FastAPI
from database import engine, Base
import models


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"mesaj": "MHRS Randevu Sistemi Backend Çalışıyor!"}

@app.get("/health")
def health_check():
    return {"durum": "saglikli"}