#!/bin/sh

# Check if the directory "./data" exists, if not, create it
if [ ! -d "./data" ]; then
    mkdir "./data"
fi

# Absolute path where db.txt is saved
db_file_path="$(pwd)/data/db.txt"
echo "Saving db.txt in: $db_file_path"

# Delete the existing output file if it exists
if [ -f "$db_file_path" ]; then
    rm "$db_file_path"
fi

# Initialize the output file
touch "$db_file_path"

# Create a temporary file for storing the output of the process substitution
temp_file=$(mktemp)

# Create an indexed list of directories and store it in a file
find . -type d | awk '{print "DIR" NR " " $0}' > "$temp_file"

# Define file extensions for common code files
exts="py js html css java c cpp sh php rb ts tsx vite.ts config json"

# Find every file in the directory recursively with the specified extensions
for ext in $exts; do
    find . -type f -name "*.$ext" | while IFS= read -r file; do
        # Skip files larger than 1MB
        file_size=$(stat -f%z "$file" 2>/dev/null)
        if [ -z "$file_size" ] || [ "$file_size" -gt 1048576 ]; then
            continue
        fi

        # Check if the file contains only ASCII characters
        if file "$file" | grep -q 'ASCII text'; then
            # Get the directory of the current file
            dir=$(dirname "$file")

            # Find the ID of the directory
            dir_id=$(grep -m1 -F "$dir" "$temp_file" | awk '{print $1}')

            # Append the contents of the file to ../data/db.txt with directory ID, filename, and line number
            awk -v dir_id="$dir_id" '{print dir_id, FILENAME, FNR, $0}' "$file" >> "$db_file_path"
        fi
    done
done

# Remove the temporary file
rm "$temp_file"
