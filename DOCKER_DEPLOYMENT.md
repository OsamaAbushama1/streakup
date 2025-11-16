# Docker Deployment Guide for StreakUp

This guide explains how to deploy and run the StreakUp application using Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) installed (version 2.0+)

## Quick Start

### 1. Clone and Navigate to Project

```bash
cd streakup
```

### 2. Set Up Environment Variables

Create environment files for backend and frontend:

**Backend** - Create `backend/.env`:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://admin:password@mongodb:27017/streakup?authSource=admin
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-jwt-key-here
# Add other environment variables as needed
# STRIPE_SECRET_KEY=your-stripe-key
# EMAIL_USER=your-email
# EMAIL_PASS=your-email-password
```

**Frontend** - Create `frontend/.env.local` (optional, can use docker-compose):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## Individual Service Commands

### Build Individual Services

```bash
# Build backend only
docker-compose build backend

# Build frontend only
docker-compose build frontend

# Build all services
docker-compose build
```

### Run Individual Services

```bash
# Start only MongoDB
docker-compose up -d mongodb

# Start only backend
docker-compose up -d backend

# Start only frontend
docker-compose up -d frontend
```

## Development Mode

For development, you can mount your source code as volumes:

### Update docker-compose.yml for Development

```yaml
services:
  backend:
    volumes:
      - ./backend/src:/app/src  # Mount source for hot reload
      - ./backend/uploads:/app/uploads
      - ./backend/public:/app/public
    # Override command for development
    command: npm run dev

  frontend:
    volumes:
      - ./frontend/src:/app/src  # Mount source for hot reload
      - ./frontend/public:/app/public
    # Override command for development
    command: npm run dev
```

Then run:
```bash
docker-compose up
```

## Production Deployment

### 1. Build Production Images

```bash
docker-compose -f docker-compose.yml build
```

### 2. Set Production Environment Variables

Update `docker-compose.yml` with production values:
- Update `MONGO_URI` to your production MongoDB
- Update `FRONTEND_URL` to your production frontend URL
- Set all required secrets (JWT_SECRET, etc.)

### 3. Run in Production

```bash
docker-compose up -d
```

## Docker Commands Reference

```bash
# View running containers
docker-compose ps

# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove all containers and networks
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

## Troubleshooting

### Backend Won't Start

1. **Check MongoDB connection**:
   ```bash
   docker-compose logs mongodb
   docker-compose logs backend
   ```

2. **Verify environment variables**:
   ```bash
   docker-compose exec backend env
   ```

3. **Check if MongoDB is ready**:
   ```bash
   docker-compose exec mongodb mongosh -u admin -p password
   ```

### Frontend Build Fails

1. **Clear Next.js cache**:
   ```bash
   docker-compose exec frontend rm -rf .next
   docker-compose up -d --build frontend
   ```

2. **Check build logs**:
   ```bash
   docker-compose logs frontend
   ```

### Port Already in Use

If ports 3000, 5000, or 27017 are already in use:

1. **Change ports in docker-compose.yml**:
   ```yaml
   services:
     backend:
       ports:
         - "5001:5000"  # Change host port
     
     frontend:
       ports:
         - "3001:3000"  # Change host port
   ```

2. **Or stop the conflicting service**:
   ```bash
   # Find what's using the port
   lsof -i :3000
   lsof -i :5000
   ```

### Canvas Package Issues

The backend uses `canvas` which requires system dependencies. The Dockerfile includes these, but if you encounter issues:

1. **Rebuild the backend image**:
   ```bash
   docker-compose build --no-cache backend
   ```

2. **Check if all dependencies are installed**:
   ```bash
   docker-compose exec backend apk list | grep cairo
   ```

## Using External MongoDB

If you want to use MongoDB Atlas or an external MongoDB instance:

1. **Update docker-compose.yml**:
   ```yaml
   services:
     backend:
       environment:
         - MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/streakup
       depends_on:
         - mongodb  # Remove this line
   
     # Remove or comment out mongodb service
     # mongodb:
     #   ...
   ```

2. **Or use environment variable**:
   ```bash
   MONGO_URI=mongodb+srv://... docker-compose up
   ```

## Volume Management

### Persistent Data

The `docker-compose.yml` includes volumes for:
- **MongoDB data**: `mongodb_data` (persists database)
- **Backend uploads**: `./backend/uploads` (file uploads)
- **Backend public**: `./backend/public` (static assets)

### Backup MongoDB

```bash
# Create backup
docker-compose exec mongodb mongodump --out /data/backup --username admin --password password --authenticationDatabase admin

# Restore backup
docker-compose exec mongodb mongorestore /data/backup --username admin --password password --authenticationDatabase admin
```

## Security Considerations

1. **Change default MongoDB credentials** in `docker-compose.yml`
2. **Use secrets management** for production (Docker secrets, environment files)
3. **Don't commit `.env` files** to version control
4. **Use HTTPS** in production (consider adding nginx reverse proxy)
5. **Limit exposed ports** in production

## Production Recommendations

1. **Use Docker Swarm or Kubernetes** for orchestration
2. **Set up reverse proxy** (nginx/traefik) for SSL termination
3. **Use managed MongoDB** (MongoDB Atlas) instead of containerized MongoDB
4. **Implement health checks** in docker-compose.yml
5. **Set resource limits** for containers
6. **Use Docker secrets** for sensitive data
7. **Enable logging** to external service (e.g., ELK stack)

## Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: always
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - FRONTEND_URL=${FRONTEND_URL}
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

