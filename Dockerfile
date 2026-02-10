FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3200

CMD ["npm", "run", "dev", "--", "-p", "3200"]
