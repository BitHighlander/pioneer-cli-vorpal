#!/bin/bash

# Step 1: Clone the LND repository
git clone https://github.com/lightningnetwork/lnd
cd lnd

# Step 2: Check out to the most recent stable version
git checkout $(git describe --abbrev=0 --tags)

# Step 3: Install LND
make install

# Step 4: Create lnd.conf configuration file
# Add the configuration parameters that are not already set
if [ -f ~/.lnd/lnd.conf ]; then
    echo "lnd.conf already exists. Updating existing configuration parameters"
    sed -i '/#/!s/^\(bitcoin\.active=\).*/\1true/' ~/.lnd/lnd.conf
    sed -i '/#/!s/^\(bitcoin\.mainnet=\).*/\1true/' ~/.lnd/lnd.conf
    sed -i '/#/!s/^\(bitcoin\.node=\).*/\1neutrino/' ~/.lnd/lnd.conf
else
    mkdir -p ~/.lnd
    cat > ~/.lnd/lnd.conf << EOF
    bitcoin.active=true
    bitcoin.mainnet=true
    bitcoin.node=neutrino
EOF
fi

# Step 5: Start LND
lnd