#!/bin/bash
export CLEAR_DB=true

# Stop containers and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build