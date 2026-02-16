# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /usr/src/app

# Copy config files
COPY package*.json ./
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json ./

# Install ALL dependencies (including devDeps for building)
RUN npm install

# Copy source code
COPY . .

# Build the client and server
# This runs the "build" script we defined in package.json
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package.json to install runtime deps
COPY --from=builder /usr/src/app/package*.json ./

# Install ONLY production dependencies (saves space, avoids dev conflicts)
RUN npm install --omit=dev

# Copy the built artifacts from Stage 1
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server
CMD ["npm", "start"]