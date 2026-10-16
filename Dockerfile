FROM node:22.22.0-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

# Medusa outputs the server + admin to .medusa/server; run from there
WORKDIR /app/.medusa/server
RUN npm install --omit=dev

ENV NODE_ENV=production

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]