# ── Frontend – Vue 3 + Vite (dev server) ─────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Instalar dependencias (incluye devDependencies, necesarias para Vite)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

EXPOSE 5173

# --host 0.0.0.0 es obligatorio para que Docker exponga el puerto al host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
