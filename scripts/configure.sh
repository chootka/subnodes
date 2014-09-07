# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOFTWARE INSTALL
#
# update the packages (may take a long time)
sudo apt-get update
#&& sudo apt-get -y upgrade

# install prerequisite software
sudo apt-get install -y batctl bridge-utils iw hostapd dnsmasq

# add the batman-adv module to be started on boot
sudo sed -i '$a batman-adv' /etc/modules
sudo modprobe batman-adv


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# INSTALL NODE
#
# install node.js binary and put it in /usr/local
cd /usr/local
wget http://nodejs.org/dist/v0.9.9/node-v0.9.9-linux-arm-pi.tar.gz
sudo tar xzvf node-v0.9.9-linux-arm-pi.tar.gz --strip=1

# go back to our subnodes directory
cd ~/www/subnodes/

# download subnodes app dependencies
sudo npm install
sudo npm install -g nodemon


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# NETWORK CONFIGURATION
#
# modify the network interface config file
sudo python scripts/configure_network_interfaces.py

# copy in our hostapd configuration file
sudo cp scripts/conf/hostapd.conf /etc/hostapd/hostapd.conf

# copy in our hostapd init script
sudo cp scripts/conf/hostapd /etc/default/hostapd

# copy in our dnsmasq configuration file
sudo cp scripts/conf/dnsmasq.conf /etc/dnsmasq.conf

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CREATE STARTUP SCRIPT
#
# copy startup script to init.d
# subnodes script configures and starts access point, mesh point, and chat application on boot
sudo cp scripts/subnodes.sh /etc/init.d/subnodes
sudo chmod 755 /etc/init.d/subnodes
sudo update-rc.d subnodes defaults

# set the hostapd and dnsmasq services to autostart on boot up
sudo update-rc.d hostapd enable
sudo update-rc.d dnsmasq enable

# start chat application
# sudo NODE_ENV=production nodemon subnode.js
sudo /etc/init.d/subnodes restart