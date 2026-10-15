FROM node:22.22.0-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g npm@11.10.0 && npm ci --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
