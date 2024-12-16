# Development Journal Documentation

> This guide was written by taking reference from these resources: 
> - [Docker's Official Documentation Guide](https://docs.docker.com/contribute/documentation-style/)
> - [PostgreSQL Documentation Best Practices](https://www.postgresql.org/docs/current/docguide.html)
> - [Digital Ocean's Technical Writing Guidelines](https://www.digitalocean.com/community/tutorials/digitalocean-s-technical-writing-guidelines)
> - [Google's Technical Writing Guide](https://developers.google.com/tech-writing)

## Development Timeline

### Phase 1: Project Initialization (Oct 15, 2024)
#### Commit: ac52a7d - "Initial commit"
  - Created repository
  - Added initial .gitignore
  - Basic README setup

#### Commit: ce89c89 - "Adding all base project files"
  - Added core project structure
  - Set up React with Vite
  - Added initial assets:
    - Pet images
    - Shopkeeper images
    - Custom fonts
    - UI elements
  - Created base configuration files:
    - Dockerfile
    - nginx.conf
    - package.json
  - Set up basic React components
  - Added initial styling

### Phase 2: Database Setup (Dec 11, 2024)
#### Commit: b7830bb - "Database being spun up as a container"
- Initialized PostgreSQL container setup
- Created initial database schema
- Implemented Docker configuration for database
- **Technical Decision**: Chose PostgreSQL over MongoDB due to structured data requirements
- **Challenge**: Container orchestration setup
- **Solution**: Implemented Docker Compose for service management

### Phase 3: Database Connection (Dec 11, 2024)
#### Commit: fbbe75d - "Stable database connection"
- Established reliable database connectivity
- Implemented connection pooling
- Added health checks for database
- **Technical Decision**: Used pg library for PostgreSQL interaction
- **Challenge**: Connection stability issues
- **Solution**: Added proper health checks and connection retry logic

### Phase 4: Message Persistence (Dec 11, 2024)
#### Commit: c7f4b37 - "Persistent messages working"
- Implemented message storage and retrieval
- Added data persistence between container restarts
- Created volume mapping for database
- **Technical Decision**: Used Docker volumes for data persistence
- **Challenge**: Message synchronization across sessions
- **Solution**: Implemented proper database transaction handling


## Lessons Learned
1. Importance of unit testing during development and to avoid errors
2. Benefits (need) of Docker volume persistence
3. Need for proper connection handling
