#!/bin/bash

# Check if the directory is a git repository
if [ -d .git ] || git rev-parse --git-dir > /dev/null 2>&1; then
    # Add all changes to the staging area
    git add .

    # Commit with a default message
    commit_message="Automatic commit"
    if [ $# -eq 1 ]; then
        commit_message=$1
    fi
    git commit -m "$commit_message"

    # Push to the remote repository
    git push origin
else
    echo "This directory is not a Git repository."
fi
