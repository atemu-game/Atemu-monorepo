# Dockerfile
FROM node:20

WORKDIR /app

COPY . .

# Install dependencies
RUN yarn install

# Install NestJS CLI globally
RUN yarn global add @nestjs/cli

# Command to run the service
CMD ["yarn", "workspace", "api-service", "start:dev"] 
