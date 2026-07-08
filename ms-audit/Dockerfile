# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Configure npm for better network connectivity
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry https://registry.npmjs.org/

COPY package*.json ./

RUN npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3004

CMD ["node", "dist/main"]
