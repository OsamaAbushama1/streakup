# Quick Fix: Frontend Can't Connect to Backend

## The Problem
Frontend is trying to connect to `http://localhost:5000` but getting `ERR_CONNECTION_REFUSED`.

## Solution Steps

### 1. Check if Backend is Running
```bash
# Check Docker containers
docker-compose ps

# Should show:
# streakup-backend    Up (healthy)
# streakup-frontend   Up
# streakup-mongodb     Up
```

### 2. Test Backend Directly
```bash
# Test if backend is accessible
curl http://localhost:5000/

# Should return: {"message":"Server is running"}
```

### 3. Rebuild Frontend (IMPORTANT)
The frontend needs to be rebuilt with the environment variable:

```bash
# Stop containers
docker-compose down

# Rebuild frontend (this bakes NEXT_PUBLIC_API_URL into the build)
docker-compose build --no-cache frontend

# Start everything
docker-compose up -d

# Check logs
docker-compose logs frontend
docker-compose logs backend
```

### 4. Verify Environment Variable
```bash
# Check if the variable is set in the running container
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
```

## Alternative: Create .env.local for Local Development

If you're running locally (not in Docker), create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Then rebuild:
```bash
cd frontend
npm run build
npm start
```

## For Production (Render)

1. In Render Dashboard → Frontend Service → Environment:
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`
2. Redeploy the frontend service

## Still Not Working?

1. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Check if port 5000 is in use:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

3. **Restart everything:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

