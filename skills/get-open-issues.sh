#!/bin/bash

# Check if the directory is a Git repository
if [ -d .git ] || git rev-parse --git-dir > /dev/null 2>&1; then
    # Get the URL of the origin remote from the Git configuration
    remote_url=$(git config --get remote.origin.url)

    if [[ -z $remote_url ]]; then
        echo "No remote URL found for this repository."
    else
        # Extract the username and repository name from the remote URL
        re="github.com[/:](.+)/(.+)\.git"
        if [[ $remote_url =~ $re ]]; then
            user=${BASH_REMATCH[1]}
            repo=${BASH_REMATCH[2]}
            echo "Fetching open issues for repository $user/$repo"

            # Fetch open issues from GitHub API
            issues=$(curl -s "https://api.github.com/repos/$user/$repo/issues?state=open")

            # Format the output of the open issues into a ascii table
            echo "Open issues:"
            echo "$issues" | jq -c -r '.[] | [.title, .state, .html_url, .body, .created_at, .updated_at, .assignee.login, .labels[].name] | @tsv' | sed 's/\t/|/g' | column -s '|' -t
        else
            echo "This repository is not hosted on GitHub."
        fi
    fi
else
    echo "This directory is not a Git repository."
fi
