

redis-server &


sleep 5



# until nc -z mongo 27017; do
#   echo "Waiting for MongoDB..."
#   sleep 2
# done

echo "MongoDB is up, starting services..."

# Start the onchain-worker
yarn workspace onchain-queue start:dev &

# Start the onchain service
yarn workspace onchain-worker start:dev &

# Start the API service
yarn workspace api-service start:dev &

# Wait for all background processes to finish
wait