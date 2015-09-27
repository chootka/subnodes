#!/bin/sh
# Handling cloning and clean up for app from web admin panel

# Go to Subnodes Root Folder
cd ../

# Delete App
sudo rm -rf app

# Create New App
sudo mkdir app
git clone $3.git app

# Switch into app folder and try installing dependencies
cd app
sudo npm install
gulp

# Reboot?
sudo reboot