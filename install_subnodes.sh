#! /bin/bash
#
# Raspberry Pi network configuration / AP, MESH install script
# Mark Hansen
# took guidance from a script by Sarah Grant
# who took guidance from a script by Paul Miller : https://dl.dropboxusercontent.com/u/1663660/scripts/install-rtl8188cus.sh
# Updated 20 September 2015
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOME DEFAULT VALUES
#
# BRIDGE
BRIDGE_IP=192.168.3.1
BRIDGE_NETMASK=255.255.255.0

# WIRELESS RADIO DRIVER
RADIO_DRIVER=nl80211

# ACCESS POINT
AP_COUNTRY=US
AP_SSID="subnodes$((RANDOM%10000+1))"
AP_CHAN=1

# DNSMASQ STUFF
DHCP_START=192.168.3.101
DHCP_END=192.168.3.254
DHCP_NETMASK=255.255.255.0
DHCP_LEASE=1h

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script *must* be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# BEGIN INSTALLATION PROCESS
#
echo "////////////////////////"
echo "// Welcome to Subnodes!"
echo "// ~~~~~~~~~~~~~~~~~~~~~"
echo ""

echo "This installation script will install a node.js chatroom and will give you the options of configuring either a wireless access point, a BATMAN-ADV mesh point, or both. Make sure you have one or two USB wifi radios connected to your Raspberry Pi before proceeding."
echo ""
#
# CHECK USB WIFI HARDWARE IS FOUND
# also, i will need to check for one device per network config for a total of two devices
if [[ -n $(lsusb | grep RT5370) ]]; then
    echo "The RT5370 device has been successfully located."
else
    echo "The RT5370 device has not been located, check it is inserted and run script again when done."
    exit 1
fi
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOFTWARE INSTALL
#
# update the packages
echo "Updating apt-get and installing iw package for network interface configuration..."
apt-get update && apt-get install -y iw batctl
echo ""
echo "Enabling the batman-adv kernel module..."
# add the batman-adv module to be started on boot
sed -i '$a batman-adv' /etc/modules
modprobe batman-adv;
echo ""
echo "Installing Node.js..."
wget http://node-arm.herokuapp.com/node_archive_armhf.deb
sudo dpkg -i node_archive_armhf.deb
echo ""

# INSTALLING subnodes app initializer
echo "Installing subnodes app dashboard..."
# go back to our subnodes directory
cd /home/pi/subnodes/subnodes-dashboard

# download subnodes app dependencies
sudo npm install
sudo npm install -g nodemon
echo "Done!"

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE AN ACCESS POINT WITH CAPTIVE PORTAL?
#
clear
echo "Configuring Raspberry Pi as Access Point..."
echo ""

# check that iw list does not fail with 'nl80211 not found'
echo -en "checking that nl80211 USB wifi radio is plugged in...				"
iw list > /dev/null 2>&1 | grep 'nl80211 not found'
	rc=$?
	if [[ $rc = 0 ]] ; then
		echo -en "[FAIL]\n"
		echo "Make sure you are using a wifi radio that runs via the nl80211 driver."
		exit $rc
	else
		echo -en "[OK]\n"
	fi

# install required packages
echo ""
echo -en "Installing bridge-utils, hostapd and dnsmasq... 			"
apt-get install -y bridge-utils hostapd dnsmasq
echo -en "[OK]\n"

# CONFIGURE /etc/network/interfaces
echo -en "Creating new network interfaces configuration file with your settings... 	"
cat <<EOF > /etc/network/interfaces
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp

iface ap0 inet static
	address 10.0.0.1
	netmask 255.255.255.0

# create bridge
iface br0 inet static
  bridge_ports bat0 ap0
  bridge_stp off
  address $BRIDGE_IP
  netmask $BRIDGE_NETMASK

iface default inet dhcp
EOF
	rc=$?
	if [[ $rc != 0 ]] ; then
			echo -en "[FAIL]\n"
		echo ""
		exit $rc
	else
		echo -en "[OK]\n"
	fi

# delete wlan0 and wlan1
ifconfig wlan0 down
ifconfig wlan1 down
iw wlan0 del
iw wlan1 del

# create hostapd init file
		echo -en "Creating default hostapd file...			"
		cat <<EOF > /etc/default/hostapd
DAEMON_CONF="/etc/hostapd/hostapd.conf"
EOF
			rc=$?
			if [[ $rc != 0 ]] ; then
				echo -en "[FAIL]\n"
				echo ""
				exit $rc
			else
				echo -en "[OK]\n"
			fi

		# create hostapd configuration with user's settings
		echo -en "Creating hostapd.conf file...				"
		cat <<EOF > /etc/hostapd/hostapd.conf
interface=ap0
bridge=br0
driver=$RADIO_DRIVER
country_code=$AP_COUNTRY
ctrl_interface=/var/run/hostapd
ctrl_interface_group=0
ssid=$AP_SSID
hw_mode=g
channel=$AP_CHAN
beacon_int=100
auth_algs=1
wpa=0
macaddr_acl=0
wmm_enabled=1
ap_isolate=1
EOF
			rc=$?
			if [[ $rc != 0 ]] ; then
				echo -en "[FAIL]\n"
				echo ""
				exit $rc
			else
				echo -en "[OK]\n"
			fi

		# backup the existing interfaces file
		echo -en "Creating backup of network interfaces configuration file... 			"
		cp /etc/network/interfaces /etc/network/interfaces.bak
		rc=$?
		if [[ $rc != 0 ]] ; then
			echo -en "[FAIL]\n"
			exit $rc
		else
			echo -en "[OK]\n"
		fi

		# CONFIGURE dnsmasq
		echo -en "Creating dnsmasq configuration file... 			"
		cat <<EOF > /etc/dnsmasq.conf
interface=br0
address=/#/$BRIDGE_IP
address=/apple.com/0.0.0.0
dhcp-range=$DHCP_START,$DHCP_END,$DHCP_NETMASK,$DHCP_LEASE
EOF
		rc=$?
		if [[ $rc != 0 ]] ; then
    			echo -en "[FAIL]\n"
			echo ""
			exit $rc
		else
			echo -en "[OK]\n"
		fi



# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# COPY OVER THE ACCESS POINT START UP SCRIPT + enable services
#
# Change Directory
cd /home/pi/subnodes

clear
# AP Startup Script
echo -en "Copying access point startup script for boot"
update-rc.d hostapd enable
update-rc.d dnsmasq enable
cp scripts/subnodes_config_ap.sh /etc/init.d/subnodes_config_ap
chmod 755 /etc/init.d/subnodes_config_ap
update-rc.d subnodes_config_ap defaults

# Subnode Dashboard Startup Script
cp scripts/setup_dashboard.sh /etc/init.d/setup_dashboard
chmod 755 /etc/init.d/setup_dashboard
update-rc.d setup_dashboard defaults

# Node App Startup Script
cp scripts/setup_app.sh /etc/init.d/setup_app
chmod 755 /etc/init.d/setup_app
update-rc.d setup_app defaults





reboot
