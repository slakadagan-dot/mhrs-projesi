from datetime import datetime, timedelta
from jose import jwt
import bcrypt # Sorunlu passlib yerine doğrudan bcrypt kullanıyoruz

# JWT Ayarları
SECRET_KEY = "mhrs_gizli_anahtar_buraya" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    # Şifreleri byte formatına çevirip güvenli şekilde karşılaştırır
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # Şifreyi bcrypt ile şifreleyip veritabanına yazılacak metne çevirir
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt