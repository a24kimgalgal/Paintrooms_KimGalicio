# ── Backend – Node.js + Express + Socket.io ──────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Instalar dependencias primero (aprovecha la caché de Docker)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar el código fuente
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
