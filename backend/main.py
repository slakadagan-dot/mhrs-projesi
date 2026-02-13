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
# YENİ EKLENEN KULLANICILARI LİSTELEME (GET) METODU
@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    # Veritabanındaki tüm kullanıcıları çek
    kullanicilar = db.query(models.User).all()
    return kullanicilar
# ... (Üstteki kodlar aynen kalacak)

# --- YENİ EKLENEN RANDEVU OLUŞTURMA API'Sİ ---
@app.post("/appointments/")
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    
    # 1. Veritabanından Hasta ve Doktoru bul
    hasta = db.query(models.User).filter(models.User.id == appointment.patient_id).first()
    doktor = db.query(models.User).filter(models.User.id == appointment.doctor_id).first()

    # 2. Güvenlik Kontrolleri
    if not hasta:
        raise HTTPException(status_code=404, detail="Böyle bir hasta bulunamadı.")
    
    if not doktor or not doktor.is_doctor:
        raise HTTPException(status_code=400, detail="Seçtiğiniz kişi geçerli bir doktor değil!")

    # 3. Her şey yolundaysa Randevuyu Kaydet
    yeni_randevu = models.Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date
    )
    db.add(yeni_randevu)
    db.commit()
    db.refresh(yeni_randevu)
    
    return {"mesaj": "Randevu başarıyla oluşturuldu!", "tarih": yeni_randevu.appointment_date}
# YENİ EKLENEN RANDEVULARI LİSTELEME (GET) METODU
@app.get("/appointments/")
def get_appointments(db: Session = Depends(get_db)):
    # Veritabanındaki tüm randevuları çek
    randevular = db.query(models.Appointment).all()
    return randevular