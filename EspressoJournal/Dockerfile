# Multi-stage Dockerfile for Node.js apps (works for typical React, Next.js, Express apps)
# Designed for GCP Cloud Build / Cloud Run / App Engine flexible
# Uses Node 18 LTS; change the version if your repo requires a different Node version.

####################
# Builder stage
####################
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install build dependencies only if needed (keeps final image small)
# Copy package manifests first to leverage Docker cache
COPY package*.json ./

# Use npm ci for reproducible installs; fall back to npm install if lockfile absent
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit --progress=false; else npm install --no-audit --progress=false; fi

# Copy the rest of the source
COPY . .

# If the project has a build script, run it.
# This will be a no-op if there is no "build" script in package.json
RUN if npm run | grep -q ' build'; then npm run build; fi

####################
# Production image
####################
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# If your app expects a specific PORT, GCP services set PORT automatically. Use 8080 as default.
ENV PORT=8080

# Copy package manifests and install only production deps (keeps image small)
COPY --from=builder /usr/src/app/package*.json ./
# If you rely on native modules built in builder, copy node_modules from builder; otherwise install production deps here.
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy the rest of the app (including built assets in /build or /.next or /dist if applicable)
COPY --from=builder /usr/src/app ./

# Expose the port Cloud Run and App Engine expect
EXPOSE 8080

# Start the app. Ensure your package.json has a "start" script.
# For Next.js: "start": "next start -p $PORT"
# For CRA static: use a simple static server like "serve -s build -l $PORT"
CMD ["npm", "start"]
