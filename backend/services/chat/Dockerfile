FROM node:20-alpine
WORKDIR /app
COPY services/chat/package*.json ./services/chat/
WORKDIR /app/services/chat
RUN npm ci --omit=dev
WORKDIR /app
COPY services/chat/ ./services/chat/
COPY shared/ ./shared/
WORKDIR /app/services/chat
EXPOSE 8002
CMD ["node", "index.js"]
