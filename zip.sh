#!/bin/bash

# Folders to zip
folders="dist images third_party "

# Files to zip (modify paths if needed)
files="manifest.json privacy-policy.md README.md welcome.html"

# ZIP filename
zip_name="Deadline Dynamo - Chrome Minimized"

# Create the ZIP file
zip -r "$zip_name" $folders $files
