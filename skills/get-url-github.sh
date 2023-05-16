#!/bin/bash

# Check if the directory is a git repository
if [ -d .git ] || git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    # Get the URL of the origin remote
    remote_url=$(git config --get remote.origin.url)
    echo "The upstream URL of the current repository is: $remote_url"
else
    echo "This directory is not a Git repository."
fi
