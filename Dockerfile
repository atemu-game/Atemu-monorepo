
FROM node:20

WORKDIR /app

# Install netcat-openbsd
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*


# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

RUN yarn build

# Copy the entire workspace
COPY . .

# Set environment variables
COPY .env ./

EXPOSE 8000 5050 5051 8089 8090 8091

RUN chmod +x start.sh

CMD ["./start.sh"]
