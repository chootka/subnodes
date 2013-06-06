# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOFTWARE INSTALL
#
# update the packages (may take a long time)
sudo apt-get update
#&& sudo apt-get -y upgrade

# install prerequisite software
sudo apt-get install -y batctl bridge-utils iw hostapd dnsmasq git-core


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# NETWORK CONFIGURATION
#
# modify the network interface config file
sudo python configure_network_interfaces.py

# copy in our hostapd configuration file
sudo cp conf/hostapd.conf /etc/hostapd/hostapd.conf

# copy in our hostapd init script
sudo cp conf/hostapd /etc/default/hostapd

# copy in our dnsmasq configuration file
sudo cp conf/dnsmasq.conf /etc/dnsmasq.conf

# delete default interfaces
sudo ifconfig wlan0 down
sudo iw dev wlan0 del
sudo ifconfig wlan1 down
sudo iw dev wlan1 del

# set up BATMAN Adv (mesh networking)
sudo modprobe batman-adv
sudo iw phy phy0 interface add mesh0 type adhoc
sudo ifconfig mesh0 mtu 1528
sudo iwconfig mesh0 mode ad-hoc essid meshnet ap 02:12:34:56:78:90 channel 3
sudo ifconfig mesh0 down
sudo batctl if add mesh0

# set up the AP
batctl ap_isolation 1
sudo iw phy phy1 interface add ap0 type __ap

# set up the bridge
sudo brctl addbr br0
sudo brctl addif br0 ap0
sudo brctl addif br0 bat0


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# INSTALL NODE
#
# install node.js binary and put it in /usr/local
cd /usr/local
wget http://nodejs.org/dist/v0.9.9/node-v0.9.9-linux-arm-pi.tar.gz
sudo tar xzvf node-v0.9.9-linux-arm-pi.tar.gz --strip=1

# create directory where web apps will live
cd /home/pi
#mkdir www
# install subnodes chat room
#cd www
#git clone https://github.com/chootka/subnodes.git
#cd subnodes
#sudo npm install
#sudo npm install -g nodemon

# create startup script; starts node app and hostapd on boot
#sudo cp scripts/subnodes.sh /etc/init.d/subnodes
#sudo chmod 755 /etc/init.d/subnodes
#sudo update-rc.d /etc/init.d/subnodes defaults


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# BRING UP THE NETWORK INTERFACES
#
# bring up the BATMAN adv interface
sudo ifconfig mesh0 up
sudo ifconfig bat0 up

# bring up the AP interface and give ap0 a static IP
sudo ifconfig ap0 10.0.0.1 netmask 255.255.255.0 up

# bring up the brdige and assign it a static IP
sudo ifconfig br0 192.168.3.1 netmask 255.255.255.0 up

# start the hostapd and dnsmasq services
sudo service hostapd start
sudo service dnsmasq start

# set the hostapd and dnsmasq services to autostart on boot up
sudo update-rc.d hostapd enable
sudo update-rc.d dnsmasq enable