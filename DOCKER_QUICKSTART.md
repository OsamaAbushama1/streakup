# Docker Quick Start Guide

## 🚀 Quick Commands

### Start Everything (Production)
```bash
docker-compose up -d
```

### Start Everything (Development with Hot Reload)
```bash
docker-compose -f docker-compose.dev.yml up
```

### Stop Everything
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

## 📋 Prerequisites

1. **Install Docker**: https://www.docker.com/get-started
2. **Set Environment Variables** (optional, defaults are in docker-compose.yml):
   - Backend: Create `backend/.env` if needed
   - Frontend: Environment variables are set in docker-compose.yml

## 🎯 Common Tasks

### First Time Setup
```bash
# 1. Build all images
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Check if everything is running
docker-compose ps

# 4. View logs
docker-compose logs -f
```

### Development Workflow
```bash
# Start in development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up

# In another terminal, view logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Access Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
  - Username: `admin`
  - Password: `password`

### Useful Commands

```bash
# Restart a specific service
docker-compose restart backend

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh

# Stop and remove everything (including volumes)
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000
lsof -i :5000
lsof -i :27017

# Or change ports in docker-compose.yml
```

### Clear Everything and Start Fresh
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Check Container Status
```bash
docker-compose ps
docker ps
```

### View Container Logs
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

## 📚 More Information

For detailed documentation, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

