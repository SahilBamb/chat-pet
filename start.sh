#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z chatpet-db 5432; do
  sleep 1
done
echo "Database is ready!"

# Initialize database with optional clear flag
# We needed to add this flag for debugging - because if we add corrupted data to the database, it will crash the application on next launch
# This is a quick fix for now - we can remove and/or we will implement a more programmatic solution in the future
if [ "$CLEAR_DB" = "true" ]; then
  echo "Initializing database with clear flag..."
  bun src/services/db.setup.js
else
  echo "Database already initialized"
fi

# Start the application
echo "Starting application..."
bun run dev --host &
bun server.js 