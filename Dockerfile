FROM oven/bun

WORKDIR /app

# Install netcat
RUN apt-get update && apt-get install -y netcat-openbsd

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies including cors
RUN bun install && bun add cors

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Expose ports for both the server and Vite dev server
EXPOSE 3000 5173

# Create a start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start both servers
CMD ["/app/start.sh"]