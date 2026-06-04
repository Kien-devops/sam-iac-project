FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Run in production mode
ENV NODE_ENV=production
ENV PORT=3000

CMD [ "node", "src/app.js" ]
