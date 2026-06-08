# ─── Stage 1: Build React/Vite Application ────────────────
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Cache-friendly: install deps first
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build && rm -rf node_modules

# ─── Stage 2: Serve with Nginx ────────────────────────────
FROM nginx:1.27-alpine

LABEL maintainer="hybrid-devops-team"
LABEL description="Frontend SPA - local development"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output & custom config
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: run as non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
