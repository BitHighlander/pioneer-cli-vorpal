#!/bin/bash

# writeLOL

# Objective: Write "lol" to a text file
# Inputs: None
# Outputs: true

echo "lol" > lol.txt

if [ $? -eq 0 ]
then
  echo true
else
  echo false
fi