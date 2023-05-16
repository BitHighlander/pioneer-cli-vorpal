#!/bin/bash

# Check if the directory is a Git repository
if [ -d .git ] || git rev-parse --git-dir > /dev/null 2>&1; then
    # Get the URL of the origin remote from the Git configuration
    remote_url=$(git config --get remote.origin.url)

    if [[ -z $remote_url ]]; then
        echo "No remote URL found for this repository."
    else
        # Extract the username and repository name from the remote URL
        re="github.com[:/](.+)/(.+)(\.git)*$"
        if [[ $remote_url =~ $re ]]; then
            user=${BASH_REMATCH[1]}
            repo=${BASH_REMATCH[2]}
            echo "Fetching open issues for repository $user/$repo"

            # Fetch open issues from GitHub API
            issues=$(curl -s "https://api.github.com/repos/$user/$repo/issues?state=open")

            echo "Open issues:"
            echo "$issues"

            # Extract comments URL from the first issue
            comments_url=$(echo "$issues" | jq -r '.[0].comments_url')
            echo "Comments URL: $comments_url"

            # Query the comments URL and store the response
            comments_response=$(curl -s "$comments_url")
            echo "Comments Response:"
            echo "$comments_response"

            # Combine issues and comments_response into a JSON object
            json_output=$(jq -n --argjson issues "$issues" --argjson comments_response "$comments_response" '{issues: $issues, comments_response: $comments_response}')

            echo "JSON Output:"
            echo "$json_output"
        else
            echo "This repository is not hosted on GitHub."
        fi
    fi
else
    echo "This directory is not a Git repository."
fi
