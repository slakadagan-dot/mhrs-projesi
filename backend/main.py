from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models, schemas
import auth_utils

# Tabloları oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# YENİ EKLENEN CORS AYARLARI (React'in bağlanmasına izin verir)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme aşamasında her yerden gelen isteğe izin veriyoruz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- KULLANICI İŞLEMLERİ ---

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Bu TC numarasıyla daha önce kayıt olunmuş mu kontrol et
    db_user = db.query(models.User).filter(models.User.tc_no == user.tc_no).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu TC Kimlik No zaten kayıtlı.")
    
    # ŞİFREYİ GİZLE (HASHLE)
    hashed_password = auth_utils.get_password_hash(user.password)
    
    # Yeni kullanıcıyı veritabanına ekle
    yeni_kullanici = models.User(
        tc_no=user.tc_no,
        name=user.name,
        password=hashed_password, # 🔒 SİHİRLİ DÜZELTME BURASI: Artık gizlenmiş şifre kaydediliyor!
        is_doctor=user.is_doctor
    )
    db.add(yeni_kullanici)
    db.commit()
    db.refresh(yeni_kullanici)
    
    return {"mesaj": "Kayıt başarılı", "isim": yeni_kullanici.name}

@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    # Veritabanındaki tüm kullanıcıları çek
    kullanicilar = db.query(models.User).all()
    return kullanicilar

# --- RANDEVU İŞLEMLERİ ---

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

@app.get("/appointments/")
def get_appointments(db: Session = Depends(get_db)):
    # Veritabanındaki tüm randevuları çek
    randevular = db.query(models.Appointment).all()
    return randevular

@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    # 1. Silinecek randevuyu ID'sine göre bul
    randevu = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    
    # 2. Eğer randevu yoksa hata ver
    if not randevu:
        raise HTTPException(status_code=404, detail="Böyle bir randevu bulunamadı.")
    
    # 3. Randevuyu veritabanından sil
    db.delete(randevu)
    db.commit()
    
    return {"mesaj": f"{appointment_id} numaralı randevu başarıyla iptal edildi!"}

# --- GİRİŞ YAPMA (LOGIN) İŞLEMİ ---

@app.post("/login/")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Kullanıcıyı TC numarasına göre veritabanında bul
    kullanici = db.query(models.User).filter(models.User.tc_no == user_credentials.tc_no).first()
    
    # 2. Eğer kullanıcı yoksa veya girdiği şifre yanlışsa hata fırlat
    if not kullanici or not auth_utils.verify_password(user_credentials.password, kullanici.password):
        raise HTTPException(status_code=401, detail="TC Kimlik No veya Şifre Hatalı!")
    
    # 3. Her şey doğruysa kullanıcıya özel bir Token (Dijital Kart) üret
    access_token = auth_utils.create_access_token(data={"sub": kullanici.tc_no})
    
    return {"access_token": access_token, "token_type": "bearer", "mesaj": f"Hoşgeldin, {kullanici.name}!"}