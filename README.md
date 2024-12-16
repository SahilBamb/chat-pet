## ChatPet 

## Table of Contents
1. [Project Proposal](#project-proposal-midterm--final-submission)

2. [System Administration Guide](#basic-system-administration-guide)

3. [Development Journal](#development-journal)
   
4. [Architecture](#architecture)


## Project Proposal: Midterm & Final Submission

https://github.com/user-attachments/assets/32bedd7c-8a6a-4013-8f3a-3a97be67416e


#### Midterm Submission


- [x] I will be creating a containerized deployment for a multiplayer game called ChatPet. 
- [x] In this game, users can chat with one another and generate currency for every "like" their comments receive. 
- [x] The in-game currency can then be used to purchase digital items for their profile. 
- [x] The frontend will be built in React 
- [x] ...and I will build off a Bun base image from Docker Hub. 
- [x] The image will initially be run on my local machine
- [x] For the initial phase before the midterm, I will focus on creating a single container that includes the Node backend (bun runtime) 
- [x] ...with very small in-memory storage for basic chat functionality and locally stored currency and digital items. 
- [x] I will attempt to use Node's built in web sockets and a short lifecycle to make this possible.

 #### Final Submission
- [x] For the final, I will incorporate a Postgres* database in a second container to allow users to fully chat, 
- [x] ...generate currency from likes (MongoDB container)
- [x] ...and purchase items (MongoDB container)
- [x] I will document the process of creation
- [x] ...and create an administrator’s guide for an anyone to use to fully monitor and manage the launched project.

#### Additional Features Implemented
- [x] (Some - not 100% coverage) Unit tests and integration tests were written during development 
- [x] AI Messages are generated that dynamically respond to prompts
- [x] Utility scripts were written / parameters are passed during build to clean database
- [x] Volumes were used for persistent data storage between spinning up and spinning down containers
- [x] Many shopkeepers, items and pets were added to the game
- [x] (**Taken from Project Assignments Requirements**) "Having a clear plan about how the server will be managed is critical to its continued operation and this should be documented as well" - [System Administration Guide](SYSADMIN.md)
- [x] (**Taken from Project Assignments Requirements**) "Documenting the process is important and is part of your grade" - [Development Journal](DEVELOPMENT.md)
  
 #### Stretch Goals (Post Semester)
 - [ ] Application will be deployed to an AWS EC2 instance with a registered domain name and be publicly available for all on the internet.
 - [ ] For some stretch goals if time permits, I will expand to multiple containers using Docker Compose, where the backend, database, and an Nginx reverse proxy will run in separate containers for better performance and scalability. 
 - [ ] I will also create a marketplace where users can trade their digital items with one another. 
 - [ ] Finally, I will set up formal monitoring by tracking metrics and deploying alarms.

Note: The decison was made to switch from a MongoDB to a Postgres container because the chat feature was changed to be text based not using multi-media as originally proposed. This was done so we could feed simple text messages to AI and while multi-model (video, image, audio) multi-modal models exist, these multi-modal model APIs are prohibitively expensive.

Note: Deploying to an AWS EC2 instance was moved to a stretch goal due to scope limitations. 

## Basic System Administration Guide

### Local Development

1. In terminal: ```cd chat-pet; bun run install; bun run dev```
2. Navigate to [browser](http://localhost:5173/) to http://localhost:5173/ or the :XXXX port reserved for you by bun

### Docker Compose Deployment

```bash
# Start all containers
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild and start (after code changes)
docker-compose up --build

# Spinning down containers
docker-compose down

# Using the reset script
./scripts/reset-db.sh

# Or manually
docker-compose down -v
CLEAR_DB=true docker-compose up --build
```

## Advanced System Administration Guide

After starting the containers:
1. Navigate to [http://localhost:5173](http://localhost:5173) in your browser for the frontend
2. The backend API is available at [http://localhost:3000](http://localhost:3000)
3. WebSocket connections are automatically established
4. Database runs on port 5432 (for development purposes only)

Note: If port 5173 is already in use, Vite might use a different port - remember to check the console for the correct url

[Link to System Administration Guide](SYSADMIN.md)
- Complete guide for running and maintaining the ChatPet application
- Details on container management, database operations, and troubleshooting
- Instructions for health monitoring and common maintenance tasks

## Development Journal

[Link to Development Journal](DEVELOPMENT.md)
- Chronological development timeline with key implementation milestones

- Lessons learned during the development process


## Architecture

[Link to Architecture](ARCHITECTURE.md)
- System architecture diagrams and data flow documentation

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Gemini API key to `.env`