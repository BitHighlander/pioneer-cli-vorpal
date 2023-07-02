#!/bin/bash

# Step 1: Clone the LND repository
git clone https://github.com/lightningnetwork/lnd
cd lnd

# Step 2: Check out to the most recent stable version
git checkout $(git describe --abbrev=0 --tags)

# Step 3: Install LND
make install

# Step 4: Create lnd.conf configuration file
mkdir -p ~/.lnd
cat > ~/.lnd/lnd.conf << EOF
bitcoin.active=true
bitcoin.mainnet=true
bitcoin.node=neutrino
EOF

# Step 5: Start LND
lnd