#!/bin/bash

# Detect the OS
os=$(uname -s)

# Install or update Go
current_go_version=$(go version 2>/dev/null)
if [[ "$current_go_version" != *"go1.19"* ]]; then
    echo "Updating Go..."

    if [ "$os" = "Linux" ] || [ "$os" = "Darwin" ]; then
        # Linux or MacOS
        wget -q https://dl.google.com/go/go1.19.*.tar.gz
        sudo tar -C /usr/local -xzf go1.19.*.tar.gz
        rm go1.19.*.tar.gz
        echo "export PATH=$PATH:/usr/local/go/bin" >>~/.bashrc
        if [[ "$os" == "Darwin" ]]; then
            echo "Please restart the terminal or run 'source ~/.zshrc' to use the updated Go version"
            echo "export PATH=$PATH:/usr/local/go/bin" >>~/.zshrc
            source ~/.zshrc
        else
            source ~/.bashrc || source ~/.bash_profile || source ~/.profile || echo "Could not source profile"
        fi
    fi

    if [ "$os" = "FreeBSD" ]; then
        # FreeBSD
        sudo pkg install -y go
    fi
fi

# Step 1: Clone the LND repository
if [ ! -d lnd ]; then
    git clone https://github.com/lightningnetwork/lnd
fi
cd lnd

# Step 2: Check out to the most recent stable version
git fetch origin
git checkout $(git describe --abbrev=0 --tags)

# Step 3: Install LND
make install

# Step 4: Create lnd.conf configuration file
# Add the configuration parameters that are not already set
if [ -f ~/.lnd/lnd.conf ]; then
    echo "lnd.conf already exists. Updating existing configuration parameters"
    sed -i '' '/#/!s/^\(bitcoin\.active=\).*/\1true/' ~/.lnd/lnd.conf
    sed -i '' '/#/!s/^\(bitcoin\.mainnet=\).*/\1true/' ~/.lnd/lnd.conf
    sed -i '' '/#/!s/^\(bitcoin\.node=\).*/\1neutrino/' ~/.lnd/lnd.conf
else
    mkdir -p ~/.lnd
    cat > ~/.lnd/lnd.conf << EOF
    bitcoin.active=true
    bitcoin.mainnet=true
    bitcoin.node=neutrino
EOF
fi

# Step 5: Start LND
lnd --configfile=~/.lnd/lnd.conf
