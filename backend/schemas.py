from pydantic import BaseModel

class UserCreate(BaseModel):
    tc_no: str
    name: str
    password: str
    is_doctor: bool = False 
# ... (Üstteki UserCreate kodları aynen kalacak)

# --- YENİ EKLENEN KISIM ---
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str
   # YENİ EKLENEN LOGIN ŞEMASI
class UserLogin(BaseModel):
    tc_no: str
    password: str 