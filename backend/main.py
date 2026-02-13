from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models, schemas

# Tabloları oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Veritabanı bağlantısı almak için yardımcı fonksiyon
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"mesaj": "MHRS Randevu Sistemi Backend Çalışıyor!"}

@app.get("/health")
def health_check():
    return {"durum": "saglikli"}

# YENİ EKLENEN KAYIT OLMA (POST) METODU
@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Bu TC numarasıyla daha önce kayıt olunmuş mu kontrol et
    db_user = db.query(models.User).filter(models.User.tc_no == user.tc_no).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu TC Kimlik No zaten kayıtlı.")
    
    # Yeni kullanıcıyı veritabanına ekle
    yeni_kullanici = models.User(
        tc_no=user.tc_no,
        name=user.name,
        password=user.password, # Not: Gerçekte şifreler hash'lenerek saklanır!
        is_doctor=user.is_doctor
    )
    db.add(yeni_kullanici)
    db.commit()
    db.refresh(yeni_kullanici)
    
    return {"mesaj": "Kayıt başarılı", "isim": yeni_kullanici.name, "doktor_mu": yeni_kullanici.is_doctor}