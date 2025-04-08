# Use the official Node.js 18 image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Install ffmpeg (for video processing)
RUN apk add --no-cache \
  bash \
  ffmpeg

# Copy the rest of the application code into the container
COPY . .

# Command to run the application
CMD ["node", "index.js"]
