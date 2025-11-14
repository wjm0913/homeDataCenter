FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=http://localhost:4000
ARG VITE_WS_URL=ws://localhost:4000/ws
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
