# Deploying StreakUp to Render

This guide will help you deploy your StreakUp application (backend + frontend) to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. A MongoDB database (MongoDB Atlas recommended for production)
3. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your code is pushed to your Git repository. Render will automatically deploy from your repository.

## Step 2: Set Up MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster
2. Create a database user and get your connection string
3. Whitelist Render's IP addresses (or use `0.0.0.0/0` for all IPs during development)

## Step 3: Deploy Backend Service

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure the backend service:
   - **Name**: `streakup-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or choose a paid plan)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render sets this automatically, but you can specify)
   - `MONGO_URI` = Your MongoDB connection string
   - `FRONTEND_URL` = `https://your-frontend-service.onrender.com` (you'll update this after deploying frontend)
   - `JWT_SECRET` = A secure random string (generate one)
   - Add any other environment variables your backend needs (e.g., `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, etc.)

6. Click **"Create Web Service"**

## Step 4: Deploy Frontend Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect the same repository
3. Configure the frontend service:
   - **Name**: `streakup-frontend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`
   - **Plan**: Free (or choose a paid plan)

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-service.onrender.com` (use your actual backend URL)

5. Click **"Create Web Service"**

## Step 5: Update Environment Variables

After both services are deployed:

1. **Update Backend CORS**:
   - Go to your backend service settings
   - Update `FRONTEND_URL` to your actual frontend URL: `https://your-frontend-service.onrender.com`

2. **Update Frontend API URL** (if needed):
   - The frontend code currently uses hardcoded `http://localhost:5000`
   - You'll need to update the frontend code to use `process.env.NEXT_PUBLIC_API_URL` or the environment variable
   - Alternatively, you can create a config file (see below)

## Step 6: Update Frontend Code to Use Environment Variables

The frontend currently has hardcoded backend URLs. You have two options:

### Option A: Quick Fix - Update Each File

Search for `const backendUrl = "http://localhost:5000"` in your frontend files and replace with:
```typescript
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
```

### Option B: Create a Config File (Recommended)

Create `frontend/src/config/api.ts`:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
```

Then import and use it in your components:
```typescript
import { API_BASE_URL } from "@/config/api";
const backendUrl = API_BASE_URL;
```

## Step 7: Using render.yaml (Alternative Method)

If you prefer using the `render.yaml` file:

1. Make sure `render.yaml` is in your repository root
2. In Render Dashboard, go to **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically detect and use `render.yaml`
5. You'll still need to set environment variables in the Render dashboard

## Important Notes

### Free Tier Limitations

- Services on the free tier spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to a paid plan for production use

### File Uploads

- Render's filesystem is ephemeral (files are lost on redeploy)
- Consider using cloud storage (AWS S3, Cloudinary, etc.) for uploaded files
- Update your upload logic to use cloud storage instead of local filesystem

### Environment Variables

- Never commit `.env` files to your repository
- Always set sensitive variables in Render dashboard
- Use `NEXT_PUBLIC_` prefix for frontend environment variables in Next.js

### Database Connection

- Make sure your MongoDB Atlas cluster allows connections from Render's IPs
- Use connection string with proper authentication

## Troubleshooting

### Backend won't start
- Check build logs for TypeScript compilation errors
- Verify all environment variables are set
- Check MongoDB connection string is correct

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend service is running

### Images not loading
- Check `next.config.ts` remote patterns include Render domains
- Verify image URLs are using HTTPS in production

## Post-Deployment Checklist

- [ ] Both services are running
- [ ] Backend health check endpoint works (`/`)
- [ ] Frontend can connect to backend API
- [ ] Authentication works
- [ ] File uploads work (if using cloud storage)
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] MongoDB connection is working

## Support

For Render-specific issues, check [Render Documentation](https://render.com/docs)

