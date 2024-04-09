#!/bin/bash

zip -r "Deadline Dynamo - Firefox Full.zip" . -x ".git/*" -x ".idea/*" -x "node_modules/*" -x "dist/*"

# Folders to zip
folders="dist images third_party"

# Files to zip (modify paths if needed)
files="manifest.json privacy-policy.md README.md welcome.html"

# ZIP filename
zip_name="Deadline Dynamo - Firefox Minimized.zip"

# Create the ZIP file
zip -r "$zip_name" $folders $files
