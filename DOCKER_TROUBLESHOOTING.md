# Docker Connection Issues - Troubleshooting

## Issue: Frontend can't connect to backend (ERR_CONNECTION_REFUSED)

### Problem
The frontend is trying to connect to `http://localhost:5000` but getting connection refused.

### Solutions

#### If running in Docker locally:

1. **Check if backend is running:**
   ```bash
   docker-compose ps
   # Should show streakup-backend as "Up"
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

3. **Verify backend is accessible:**
   ```bash
   curl http://localhost:5000/
   # Should return: {"message":"Server is running"}
   ```

4. **Rebuild frontend with environment variable:**
   ```bash
   # Stop containers
   docker-compose down
   
   # Rebuild frontend (this ensures NEXT_PUBLIC_API_URL is baked into the build)
   docker-compose build frontend
   
   # Start everything
   docker-compose up -d
   ```

5. **Check environment variable is set:**
   ```bash
   docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
   # Should show: NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

#### If deployed to Render (Production):

1. **Set the backend URL in Render dashboard:**
   - Go to your frontend service settings
   - Add environment variable: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-service.onrender.com` (your actual backend URL)
   - **Important:** Redeploy the frontend service after adding the variable

2. **Verify backend URL:**
   - Make sure your backend service is running
   - Test: `curl https://your-backend-service.onrender.com/`
   - Should return: `{"message":"Server is running"}`

3. **Update CORS in backend:**
   - In backend service settings, set `FRONTEND_URL` to your frontend URL
   - Example: `https://your-frontend-service.onrender.com`

### Quick Fix for Docker

If you're running locally with Docker and the backend is on port 5000:

```bash
# 1. Make sure backend is running
docker-compose up -d backend

# 2. Rebuild frontend to include the environment variable
docker-compose build --no-cache frontend

# 3. Restart frontend
docker-compose up -d frontend

# 4. Check if it works
curl http://localhost:5000/
curl http://localhost:3000/
```

### Common Issues

1. **Backend not running:**
   - Solution: `docker-compose up -d backend`

2. **Port conflict:**
   - Check if port 5000 is already in use: `lsof -i :5000`
   - Change port in docker-compose.yml if needed

3. **Environment variable not set at build time:**
   - Next.js `NEXT_PUBLIC_*` variables must be available at BUILD time
   - Rebuild the frontend after setting the variable

4. **CORS error:**
   - Make sure `FRONTEND_URL` in backend matches your frontend URL
   - Restart backend after changing CORS settings

### Testing Connection

```bash
# From your host machine (not inside container)
curl http://localhost:5000/api/auth/profile

# Should return JSON (might be 401 if not authenticated, but connection should work)
```

### Production Checklist

- [ ] Backend service is running and accessible
- [ ] Frontend has `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] Backend has `FRONTEND_URL` set to frontend URL
- [ ] Both services are on the same network (Docker) or have proper CORS (Render)
- [ ] Frontend was rebuilt after setting environment variables

