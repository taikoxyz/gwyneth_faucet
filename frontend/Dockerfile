FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Development environment variables
ENV CI=true
ENV WDS_SOCKET_PORT=0
ENV NODE_ENV=development
ENV REACT_APP_BACKEND_URL=http://localhost:29000/api

CMD ["npm", "start"]