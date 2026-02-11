from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"mesaj": "MHRS Randevu Sistemi Backend Çalışıyor!"}

@app.get("/health")
def health_check():
    return {"durum": "saglikli"}