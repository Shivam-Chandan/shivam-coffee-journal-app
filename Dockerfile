# Multi-stage build for production deployment on GCP

# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy all source files
COPY package*.json ./
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json ./

# Install all dependencies
RUN npm install

# Build the client
RUN npm run build

# Stage 2: Runtime image
FROM node:20-slim

WORKDIR /usr/src/app

# Copy package files
COPY --from=builder /usr/src/app/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built client from builder stage
COPY --from=builder /usr/src/app/dist ./dist/

# Copy server code
COPY server/ ./server/
COPY shared/ ./shared/

# Copy server module files if needed
COPY --from=builder /usr/src/app/node_modules ./node_modules/

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["npm", "start"]
