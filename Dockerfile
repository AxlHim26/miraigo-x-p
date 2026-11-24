FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV EXPO_NO_TELEMETRY=1
EXPOSE 8081

CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
