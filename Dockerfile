# Stap 1: Angular-app bouwen
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stap 2: statische bestanden serveren met nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/smartproject-web/browser /usr/share/nginx/html
EXPOSE 80
