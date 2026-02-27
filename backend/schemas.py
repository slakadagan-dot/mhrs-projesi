from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    tc_no: str
    name: str
    password: str
    is_doctor: bool = False
    gender: str
    birth_date: str
    province: Optional[str] = None
    district: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    tc_no: str
    password: str

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str
    appointment_time: str
    clinic: str
    doctor_name: str