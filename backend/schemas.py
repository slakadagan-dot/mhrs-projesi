from pydantic import BaseModel

class UserCreate(BaseModel):
    tc_no: str
    name: str
    password: str
    is_doctor: bool = False 