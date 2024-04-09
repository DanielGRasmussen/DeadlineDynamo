#!/bin/bash

# Folders to zip
folders="dist images third_party"

# Files to zip (modify paths if needed)
files="manifest.json privacy-policy.md README.md welcome.html"

# ZIP filename
zip_name="Deadline Dynamo - Firefox Minimized.zip"

# Create the ZIP file
zip -r "$zip_name" $folders $files

# Folders to zip
folders="dist images src third_party"

# Files to zip (modify paths if needed)
files=".editorconfig .eslintrc.json .gitignore .prettierrc .stylelintrc.json LICENSE manifest.json package.json package-lock.json privacy-policy.md README.md tsconfig.json welcome.html zip.sh"

# ZIP filename
zip_name="Deadline Dynamo - Firefox Full.zip"

# Create the ZIP file
zip -r "$zip_name" $folders $files
