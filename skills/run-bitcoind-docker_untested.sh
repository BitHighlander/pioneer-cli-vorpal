#!/bin/bash

# Script Name: run-bitcoind-docker

# Objective: Runs bitcoind
# Inputs: None
# Outputs: None
# Context: Bitcoind via Docker

# Pull the Docker image of the Bitcoind
docker pull ruimarinho/bitcoin-core

# Start the Docker container in the background
docker run -d -p 127.0.0.1:8332:8332 -p 127.0.0.1:8333:8333 --name bitcoind ruimarinho/bitcoin-core

# Check the status of the Docker container
docker ps
