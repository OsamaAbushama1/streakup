# Backend Dockerfile
FROM node:20-alpine AS builder

# Install build dependencies for canvas and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for canvas
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    fontconfig \
    ttf-dejavu

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create uploads directory (must be at root level for path resolution)
# Set proper permissions for uploads directory
RUN mkdir -p uploads && \
    chmod 755 uploads

# Verify public directory structure exists
RUN if [ ! -d "public/templates" ]; then \
      echo "Warning: public/templates directory not found"; \
    else \
      echo "Public templates directory found"; \
    fi

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

