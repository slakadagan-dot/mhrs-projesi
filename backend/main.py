from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, SessionLocal
from typing import List

# GÜVENLİK İÇİN EKLENEN KÜTÜPHANELER
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- GÜVENLİK AYARLARI (ŞİFRELEME VE JWT) ---
SECRET_KEY = "mhrs_super_gizli_anahtar"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=2) # Token 2 saat geçerli
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
# ---------------------------------------------

@app.get("/system-data/")
def get_system_data():
    return {
        "provinces": ["İstanbul", "Ankara", "İzmir"],
        "districts": { 
            "İstanbul": ["Kadıköy", "Beşiktaş", "Şişli"], 
            "Ankara": ["Çankaya", "Keçiören", "Yenimahalle"], 
            "İzmir": ["Bornova", "Karşıyaka", "Konak"] 
        },
        "clinics": ["Dahiliye", "Göz Hastalıkları", "Ortopedi", "Kardiyoloji", "Nöroloji", "Cildiye"],
        "doctors": { 
            "Dahiliye": ["Dr. Ahmet Yılmaz", "Dr. Pelin Su"], 
            "Göz Hastalıkları": ["Dr. Mehmet Öz", "Dr. Ayşe Demir"], 
            "Ortopedi": ["Dr. Ali Veli"], 
            "Kardiyoloji": ["Dr. Mustafa Kemal"], 
            "Nöroloji": ["Dr. Gül Demir"], 
            "Cildiye": ["Dr. Eda Yıldız"] 
        },
        "timeSlots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30"]
    }

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.tc_no == user.tc_no.strip()).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu TC Kimlik No zaten kayıtlı.")
    
    new_user = models.User(
        tc_no=user.tc_no.strip(),
        name=user.name.strip(),
        password=hash_password(user.password.strip()), # ŞİFRE ARTIK KRİPTOLANIYOR!
        is_doctor=user.is_doctor,
        gender=user.gender,
        birth_date=user.birth_date,
        province=user.province,
        district=user.district,
        department=user.department
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login/")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    temiz_tc = user.tc_no.strip()
    temiz_sifre = user.password.strip()
    
    db_user = db.query(models.User).filter(models.User.tc_no == temiz_tc).first()
    
    # Şifre doğrulama artık Bcrypt ile güvenli bir şekilde yapılıyor
    if not db_user or not verify_password(temiz_sifre, db_user.password):
        raise HTTPException(status_code=400, detail="TC No veya Şifre hatalı")
    
    # Gerçek bir JWT Token üretiyoruz
    access_token = create_access_token(data={"sub": db_user.tc_no})
    
    return {
        "access_token": access_token, 
        "user_id": db_user.id,
        "tc_no": db_user.tc_no,
        "name": db_user.name,
        "is_doctor": db_user.is_doctor,
        "gender": db_user.gender,
        "birth_date": db_user.birth_date,
        "department": db_user.department,
        "province": db_user.province,
        "district": db_user.district
    }

@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/appointments/")
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    
    # 1. KONTROL: Doktor o saatte dolu mu?
    doctor_conflict = db.query(models.Appointment).filter(
        models.Appointment.doctor_name == appointment.doctor_name,
        models.Appointment.appointment_date == appointment.appointment_date,
        models.Appointment.appointment_time == appointment.appointment_time
    ).first()

    if doctor_conflict:
        raise HTTPException(status_code=400, detail="Seçilen doktorun bu saatteki randevusu maalesef dolu.")

    # 2. KONTROL: Hasta aynı saatte başka doktordan randevu almış mı? (YENİ)
    patient_conflict = db.query(models.Appointment).filter(
        models.Appointment.patient_id == appointment.patient_id,
        models.Appointment.appointment_date == appointment.appointment_date,
        models.Appointment.appointment_time == appointment.appointment_time
    ).first()

    if patient_conflict:
        raise HTTPException(status_code=400, detail="Sizin bu tarih ve saatte zaten başka bir randevunuz var!")

    new_appointment = models.Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time, 
        clinic=appointment.clinic,                     
        doctor_name=appointment.doctor_name            
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return new_appointment

@app.get("/appointments/{user_id}")
def get_user_appointments(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(models.Appointment.patient_id == user_id).all()

@app.get("/doctor-appointments/{doctor_name}")
def get_doctor_appointments(doctor_name: str, db: Session = Depends(get_db)):
    results = db.query(models.Appointment, models.User).join(models.User, models.Appointment.patient_id == models.User.id).filter(models.Appointment.doctor_name == doctor_name).all()
    
    clean_list = []
    for appt, user in results:
        clean_list.append({
            "id": appt.id,
            "date": appt.appointment_date,
            "time": appt.appointment_time,
            "patient_name": user.name,
            "patient_tc": user.tc_no
        })
    return clean_list

@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    
    db.delete(appointment)
    db.commit()
    return {"message": "Randevu başarıyla iptal edildi"}