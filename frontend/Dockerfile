FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package.json so vite config can read it
COPY package.json ./

# Copy frontend workspace and install dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Copy the rest of the frontend source
COPY frontend/ .
RUN npm run build

# Use Nginx to serve the built static files
FROM nginx:alpine

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
