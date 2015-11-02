#!/bin/sh
# Pulling updates on app

# Go to Subnodes Root Folder
cd ../app
sudo git stash
sudo git reset --hard origin/master
sudo git pull
sudo npm install