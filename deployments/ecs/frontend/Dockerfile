# ─── Production Nginx for Static Frontend ──────────────────
FROM nginx:1.27-alpine

LABEL maintainer="hybrid-devops-team"
LABEL description="Frontend SPA - ECS Production"

# Remove default content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom config & pre-built static files
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

# Security: run as non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
