FROM node:20-alpine
WORKDIR /app
COPY services/billing/package*.json ./services/billing/
WORKDIR /app/services/billing
RUN npm ci --omit=dev
WORKDIR /app
COPY services/billing/ ./services/billing/
COPY shared/ ./shared/
WORKDIR /app/services/billing
EXPOSE 8004
CMD ["node", "index.js"]
