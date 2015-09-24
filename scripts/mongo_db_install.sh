# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# INSTALLING MONGODB ONTO THE RASPBERRY PI 2 
# Once done, can see/edit settings via sudo nano /etc/init.d/mongod

echo "Installing MongoDB 2.1.1..."
	# Get packages for compiling
	sudo apt-get install -y build-essential libboost-filesystem-dev libboost-program-options-dev libboost-system-dev libboost-thread-dev scons libboost-all-dev python-pymongo
	# Get compatible version of MongoDB (2.1.1) for Raspbian Wheezy on a Pi2
	cd ~
	git clone https://github.com/skrabban/mongo-nonx86
	cd mongo-nonx86
	# Begin Compiling (Can take several hours)
	sudo scons --prefix=/opt/mongo install
	# Persmissions for users and groups
	sudo adduser --firstuid 100 --ingroup nogroup --shell /etc/false --disabled-password --gecos "" --no-create-home mongodb
	# Folder for log files
	sudo mkdir /var/log/mongodb/
	sudo chown mongodb:nogroup /var/log/mongodb/
	# Folder for state data
	sudo mkdir /var/lib/mongodb
	sudo chown mongodb:nogroup /var/lib/mongodb
	# Move scripts to etc
	sudo cp debian/init.d /etc/init.d/mongod
	sudo cp debian/mongodb.conf /etc/
	# Linking folders up
	sudo ln -s /opt/mongo/bin/mongod /usr/bin/mongod
	# Permissions
	sudo chmod u+x /etc/init.d/mongod
	sudo update-rc.d mongod defaults


echo "Adding Bash Command Path..."
	# Need to append mongo command to ~/.bashrc
	sudo echo "" >> ~/.bashrc
	sudo echo "PATH=$PATH:/opt/mongo/bin" >> ~/.bashrc
	sudo echo "export PATH" >> ~/.bashrc


echo "Cleaning up..."
	# Remove folders where compiling was done
	sudo rm -r ~/mongo-nonx86


echo "Rebooting..."
	reboot