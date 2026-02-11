# Python 3.9 sürümünü temel al
FROM python:3.9-slim

# Çalışma klasörünü ayarla
WORKDIR /app

# Gereksinim dosyasını kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm kodları kopyala
COPY . .

# Uygulamayı başlat (FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]