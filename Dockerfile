FROM node:22.22.0-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 9000

CMD ["npm", "start"]
