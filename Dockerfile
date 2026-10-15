FROM node:22.22.0-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 9000

CMD ["sh", "-c", "./node_modules/.bin/medusa db:migrate && ./node_modules/.bin/medusa start"]
