# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy files for npm install
COPY package.json package-lock.json ./
RUN npm install

# Copy rest of files
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "service.js"]
