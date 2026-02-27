from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users_v2" 
    id = Column(Integer, primary_key=True, index=True)
    tc_no = Column(String(11), unique=True, index=True)
    name = Column(String(50))
    password = Column(String(255))  # Şifreler sığsın diye genişletmiştik
    is_doctor = Column(Boolean, default=False)
    gender = Column(String(10))
    birth_date = Column(String(20))
    province = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    department = Column(String(50), nullable=True)

class Appointment(Base):
    __tablename__ = "appointments_v3"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users_v2.id"))
    doctor_id = Column(Integer)
    appointment_date = Column(String(20))
    appointment_time = Column(String(10))
    clinic = Column(String(100))
    doctor_name = Column(String(100))