# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm for better network connectivity
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry https://registry.npmjs.org/

# Copy package files
COPY package*.json ./

# Install dependencies with retries
RUN npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose

# Copy source
COPY . .

# Build
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Start
CMD ["node", "dist/main"]
