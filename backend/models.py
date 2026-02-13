from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tc_no = Column(String, unique=True, index=True)
    name = Column(String)
    password = Column(String)
    is_doctor = Column(Boolean, default=False)

# --- YENİ EKLENEN KISIM ---
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id")) # Hasta ID'si
    doctor_id = Column(Integer, ForeignKey("users.id"))  # Doktor ID'si
    appointment_date = Column(String) # Örn: "2024-03-15 14:30"