FROM node:16-alpine

WORKDIR /app

# Add the host entry for hCaptcha to work
RUN echo "127.0.0.1 faucet.local" >> /etc/hosts

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Set host and disable host check for development
ENV HOST=0.0.0.0
ENV WDS_SOCKET_PORT=0
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true

CMD ["npm", "start"]