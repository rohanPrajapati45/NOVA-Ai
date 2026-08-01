FROM node:20-alpine
WORKDIR /app
COPY services/agent/package*.json ./services/agent/
WORKDIR /app/services/agent
RUN npm ci --omit=dev --legacy-peer-deps
WORKDIR /app
COPY services/agent/ ./services/agent/
COPY shared/ ./shared/
RUN mkdir -p /app/services/agent/temp/uploads
WORKDIR /app/services/agent
EXPOSE 8003
CMD ["node", "index.js"]
