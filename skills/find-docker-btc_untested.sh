#!/bin/bash
# Script Name: find-docker-btc

# Set Variables
container="bitcoin-node"

# Find Docker Container
docker ps | grep $container

# Output Logs
if [ $? -eq 0 ]; then
  docker logs $container
else
  echo "Bitcoin Docker Container not found"
fi