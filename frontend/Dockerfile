# 1. Asama: Build (Derleme) - ALPINE VERSİYONU EKLENDİ
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Asama: Nginx ile Yayinlama (Deploy)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]