#!/bin/bash

# -----------------------------------------------------------------------------
# Script Name: clone-repo.sh
# Version:     1.0
# Author:      Your Name
# Date:        15 May 2023
# Description: This script is designed to perform several tasks on the current
#              directory and its subdirectories. It creates an indexed list of
#              directories, checks file sizes, checks for ASCII characters,
#              and writes certain information to a database file.
#
# Steps:
# 1. Check if the directory "../data" exists, if not, create it.
# 2. Delete the existing output file "../data/db.txt" if it exists.
# 3. Initialize the output file "../data/db.txt".
# 4. Create an indexed list of directories and store it in an array.
# 5. Write the directory index to the output file.
# 6. Define an array of file extensions for common code files.
# 7. Find every file in the directory recursively with the specified extensions.
#    - Skip files larger than 1MB.
#    - Check if the file contains only ASCII characters.
#    - If so, append the contents of the file to "../data/db.txt" with
#      directory ID, filename, and line number.
# -----------------------------------------------------------------------------

# Check if the directory "../data" exists, if not, create it
if [ ! -d "../data" ]; then
    mkdir ../data
fi

# Delete the existing output file if it exists
if [ -f "../data/db.txt" ]; then
    rm ../data/db.txt
fi

# Initialize the output file
touch ../data/db.txt

# Create a temporary file for storing the output of the process substitution
temp_file=$(mktemp)

# Create an indexed list of directories and store it in an array
dir_index=()
find . -type d | awk '{print "DIR" NR " " $0}' > "$temp_file"
while IFS= read -r line; do
    dir_index+=("$line")
done < "$temp_file"

# Remove the temporary file
rm "$temp_file"

# Define an array of file extensions for common code files
exts=("*.py" "*.js" "*.html" "*.css" "*.java" "*.c" "*.cpp" "*.sh" "*.php" "*.rb" "*.ts" "*.tsx" "*.vite.ts" "*.config" "*.json")

# Find every file in the directory recursively with the specified extensions
for ext in "${exts[@]}"; do
    while IFS= read -r -d '' file; do
        # Skip files larger than 1MB
        if [ $(stat -f%z "$file") -gt 1048576 ]; then
            continue
        fi

        # Check if the file contains only ASCII characters
        if ! LC_ALL=C grep -q '[^[:print:][:space:]]' "$file"; then
            # Get the directory of the current file
            dir=$(dirname "$file")

            # Find the ID of the directory
            dir_id=$(printf "%s\n" "${dir_index[@]}" | grep -m1 -F "$dir" | awk '{print $1}')

            # Append the contents of the file to ../data/db.txt with directory ID, filename, and line number
            awk -v dir_id="$dir_id" '{print dir_id, FILENAME, FNR, $0}' "$file" >> ../data/db.txt
        fi
    done < <(find . -type f -name "$ext" -print0)
done
