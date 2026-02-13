from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tc_no = Column(String, unique=True, index=True)
    name = Column(String)
    password = Column(String)
    is_doctor = Column(Boolean, default=False) # True ise Doktor, False ise Hasta