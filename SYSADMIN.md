# ChatPet System Administration Guide

> This guide was written by taking reference from these resources: 
> - [Google's Site Reliability Engineering Documentation Guide](https://sre.google/sre-book/documentation/)
> - [Digital Ocean's Technical Writing Guidelines](https://www.digitalocean.com/community/tutorials/digitalocean-s-technical-writing-guidelines)
> - [AWS Documentation Best Practices](https://docs.aws.amazon.com/awsdocs/latest/aws-doc-sdk-examples/latest/guide/best-practices-writing.html)

## System Architecture

The ChatPet application consists of two main containers:

1. **Database Container (chatpet-db)**
   - PostgreSQL database
   - Stores messages, users, and inventory
   - Persists data using Docker volumes
   - Runs on port 5432

2. **Web Application Container (chatpet-web)**
   - Bun.js server running Express backend
   - Vite development server for React frontend
   - Backend runs on port 3000
   - Frontend runs on port 5173

## Container Management

### Starting the Application

```bash
# Start all containers
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild and start (after code changes)
docker-compose up --build
```

### Stopping the Application

```bash
# Stop containers but keep data
docker-compose down

# Stop containers and remove volumes (will delete all data)
docker-compose down -v
```

### Checking Container Status

```bash
# List running containers
docker ps

# View container logs
docker logs chatpet-db
docker logs chatpet-web

# Follow logs in real-time
docker logs -f chatpet-web
```

## Database Management

### Connecting to Database

```bash
# Connect to PostgreSQL database
docker exec -it chatpet-db psql -U admin -d chatpet

# Common PostgreSQL commands:
\dt             # List tables
\d+ tablename   # Describe table
\q              # Quit
```

### Database Management

### Reset Database
To clear all data and reset the database:
```bash
# Using the reset script
./scripts/reset-db.sh

# Or manually
docker-compose down -v
CLEAR_DB=true docker-compose up --build
```

### Generally Useful Database Queries

```sql
-- Check users
SELECT * FROM users;

-- Check recent messages
SELECT m.*, u.username 
FROM messages m 
JOIN users u ON m.user_id = u.id 
ORDER BY m.created_at DESC 
LIMIT 10;

-- Check inventory
SELECT * FROM inventory;
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect chatpet_postgres_data

# Backup database
docker exec chatpet-db pg_dump -U admin chatpet > backup.sql

# Restore database
cat backup.sql | docker exec -i chatpet-db psql -U admin -d chatpet
```

## Health Monitoring

### Database Health

```bash
# Check database health
docker exec chatpet-db pg_isready -U admin -d chatpet

# Check database size
docker exec -it chatpet-db psql -U admin -d chatpet -c "\l+"
```

### Application Health

```bash
# Check if servers are responding
curl http://localhost:3000/messages    # Backend API
curl http://localhost:5173            # Frontend

# Check WebSocket connection
wscat -c ws://localhost:3000          # Requires wscat package
```

### Resource Usage

```bash
# Check container resource usage
docker stats chatpet-db chatpet-web

# Check container processes
docker top chatpet-web
docker top chatpet-db
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database logs
   docker logs chatpet-db
   
   # Verify database is accepting connections
   docker exec chatpet-db pg_isready
   ```

2. **Web Server Issues**
   ```bash
   # Check web server logs
   docker logs chatpet-web
   
   # Restart web container
   docker-compose restart web
   ```

3. **Volume Issues**
   ```bash
   # Check volume permissions
   docker exec chatpet-db ls -la /var/lib/postgresql/data
   
   # Recreate volumes (will delete data)
   docker-compose down -v
   docker-compose up --build
   ```

### Debug Endpoints

The application provides several debug endpoints for troubleshooting:

```bash
# Get message overview
GET /debug/messages
# Returns simplified message data including IDs, user IDs, types, and message previews

# Get users and messages data
GET /debug/users
# Returns complete data from users and messages tables

# Test AI responses (currently commented out)
# GET /debug/ai-test
# Tests AI response generation with sample messages
```

Note: These debug endpoints are primarily for development and testing purposes. I will likely disable them in production environments for security.

## Maintenance Tasks

### Regular Maintenance

1. **Backup Database**
   ```bash
   # Create backup
   docker exec chatpet-db pg_dump -U admin chatpet > backup_$(date +%Y%m%d).sql
   ```

2. **Clean Old Data**
   ```sql
   -- Delete old messages (older than 30 days)
   DELETE FROM messages 
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

3. **Check Logs**
   ```bash
   # Archive container logs
   docker logs chatpet-web > web_logs_$(date +%Y%m%d).log
   docker logs chatpet-db > db_logs_$(date +%Y%m%d).log
   ```

### Updating the Application

1. Pull latest code changes
2. Rebuild containers:
   ```bash
   docker-compose down
   git pull
   docker-compose up --build
   ```

## TODO: Security Quick Fixes 

1. Database credentials are stored in docker-compose.yml
2. Database port (5432) is exposed for development
3. Consider using environment variables for sensitive data
4. In production, use proper SSL/TLS certificates

## TODO: Implement Monitoring Recommendations

TODO: Implement Monitoring - here are recommended tools taken from a popular web blog for future reference. 

**THIS IS A STRETCH GOAL AND IS NOT IMPLEMENTED YET**

1. **Container Monitoring**
   - [Prometheus](https://prometheus.io/docs/introduction/overview/) for metrics collection
   - [Grafana](https://grafana.com/docs/) for visualization
   - [cAdvisor](https://github.com/google/cadvisor) for container metrics

2. **Database Monitoring**
   - [pgMonitor](https://github.com/CrunchyData/pgmonitor) for PostgreSQL monitoring
   - [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html) for query performance tracking
   - [pgBadger](https://github.com/darold/pgbadger) for log analysis

3. **WebSocket Monitoring**
   - [Socket.IO Admin UI](https://socket.io/docs/v4/admin-ui/) for WebSocket connections
   - Custom metrics using [Prometheus client](https://github.com/siimon/prom-client)

4. **Disk Usage**
   - [Netdata](https://github.com/netdata/netdata) for real-time monitoring
   - [Telegraf](https://github.com/influxdata/telegraf) for metrics collection


## Testing During Development

During the development of ChatPet, I wrote a few tests to debug features issues that were not working as expected. These tests helped isolate issues and verify functionality (or lack of working functionality).

These are not required for checking system health, but can be used to root cause an issue. 

1. **AI Functionality Tests** (`ai.test.js`): Ensures the AI generates appropriate responses based on user inputs.

2. **Application Integration Tests** (`app.test.js`): Covers user message creation, retrieval, voting, and inventory management to confirm endpoint functionality.

3. **Database Integration Tests** (`db.integration.test.js`): Tests user creation, message saving, and inventory management to ensure proper database operations.

4. **Database Connection Tests** (`db.test.js`): Verifies database connectivity and basic operations like user and message handling.

5. **Gemini AI Tests** (`test-gemini.js`): Tests integration with Google Generative AI, checking the availability and quality of AI-generated responses.

These tests allowed the team to quickly identify and fix issues, leading to a more stable application and providing a foundation for future development.
