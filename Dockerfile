# Use the official Node.js image as the base image
FROM node:20-slim

# --- 1. SETUP WORKSPACE ---

# Set the working directory inside the container to /usr/src/app
WORKDIR /usr/src/app

# --- 2. COPY & INSTALL DEPENDENCIES ---

# Copy only the package files from the server/ directory to a server/ folder inside the container.
# This speeds up subsequent builds by leveraging Docker layer caching.
COPY server/package*.json ./server/

# Install server dependencies inside the server folder.
# This is necessary because server/package.json is there.
RUN cd server && npm install

# --- 3. COPY SOURCE CODE ---

# Copy the rest of the server source code into the container's server/ directory
COPY server/ ./server/

# --- 4. SET ENTRY POINT ---

# Change the working directory to the server application root.
WORKDIR /usr/src/app/server

# Command to run the application using the start script in server/package.json.
# This ensures the Express server starts listening on the PORT provided by Cloud Run.
CMD [ "npm", "start" ]
