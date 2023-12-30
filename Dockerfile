# Use the official Node.js 18 slim image
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the app will run on (adjust as needed)
EXPOSE 5000

# Start the Node.js application
CMD ["node", "index.js"]
