#!/bin/sh
# Handling cloning and clean up for app from web admin panel

# Go to Subnodes Root Folder
cd ../

# Delete App
sudo rm -rf app

# Create New App
sudo mkdir app
git clone $3.git app

# Try getting dependencies
cd app
sudo npm install

# Reboot?
sudo reboot