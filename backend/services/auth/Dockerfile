FROM node:20-alpine
WORKDIR /app
COPY services/auth/package*.json ./services/auth/
WORKDIR /app/services/auth
RUN npm ci --omit=dev
WORKDIR /app
COPY services/auth/ ./services/auth/
COPY shared/ ./shared/
WORKDIR /app/services/auth
EXPOSE 8001
CMD ["node", "index.js"]
