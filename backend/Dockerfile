FROM python:3.12-slim
WORKDIR /app

# Sadece gerekli Python kütüphanelerini kuruyoruz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kodları kopyala ve çalıştır
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]