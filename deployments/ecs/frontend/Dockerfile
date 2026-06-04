FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expects a built dist folder in context
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
