#!/bin/bash
# Script Name: find-docker-btc

# Set Variables
container="bitcoin-node"

# Find Docker Container
container_id=$(docker ps | grep "$container" | awk '{print $1}')

# Output Logs
if [ -n "$container_id" ]; then
  docker logs "$container_id"
else
  echo "Bitcoin Docker Container not found"
fi