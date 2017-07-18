#! /bin/bash
#
# Raspberry Pi network configuration / AP, MESH install script
# Contributors: Sarah Grant, Mark Hansen
# took guidance from a script by Paul Miller : https://dl.dropboxusercontent.com/u/1663660/scripts/install-rtl8188cus.sh
# Updated 10 May 2015
#
# TO-DO
# - allow a selection of radio drivers
# - fix addressing to avoid collisions below (peek at pirate box)
# - remove dependency on batctl for bat0 interface. currently, bat0 interface is needed for the bridge, should the user decide to set up an AP.
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOME DEFAULT VALUES
#
#  READ configuration file
. ./subnodes.config

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

read -p "This installation script will set up a wireless access point, captive portal and node.js chatroom with the additional option of configuring a BATMAN-ADV mesh point. Make sure you have one or two USB wifi radios connected to your Raspberry Pi before proceeding. Press any key to continue..."
echo ""
#
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
echo "Loading the subnodes configuration file..."
## Check if configuration exists, ask for overwriting
if [ -e /etc/subnodes.config ] ; then
        read -p "Older config file found! Overwrite? (y/n) [N]" -e $q
        if [ "$q" == "y" ] ; then
                echo "...overwriting"
                copy_ok="yes"
        else
                echo "...not overwriting. Re-reading found configuration file..."
                . /etc/subnodes.config
        fi
else
        copy_ok="yes"
fi
# copy config file to /etc
[ "$copy_ok" == "yes" ] && cp subnodes.config /etc
echo "Installing Node.js..."
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
dpkg -i node_latest_armhf.deb
echo ""

# INSTALLING node.js chat room
echo "Installing chat room..."
# go back to our subnodes directory
cd /home/pi/subnodes/

# download subnodes app dependencies
npm install
npm install -g nodemon
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

# APPEND TO /etc/dhcpcd.conf
echo -en "Appending new network interfaces to /etc/dhcpcd.conf file with your settings... 	"
cat <<EOT >> /etc/dhcpcd.conf
# create bridge
interface br0
static ip_address=$BRIDGE_IP
static netmask=$BRIDGE_NETMASK
EOT
rc=$?
if [[ $rc != 0 ]] ; then
    	echo -en "[FAIL]\n"
	echo ""
	exit $rc
else
	echo -en "[OK]\n"
fi

# backup the existing interfaces file
echo -en "Creating backup of network interfaces configuration file... 	"
cp /etc/network/interfaces /etc/network/interfaces.bak
rc=$?
if [[ $rc != 0 ]] ; then
		echo -en "[FAIL]\n"
	exit $rc
else
	echo -en "[OK]\n"
fi

# CREATE NEW /etc/network/interfaces
echo -en "Creating new network interfaces with your settings... 	"
cat <<EOF > /etc/network/interfaces
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp

iface ap0 inet static
  address 10.0.0.1
  netmask 255.255.255.0

auto br0
iface br0 inet static
bridge_ports bat0 ap0
bridge_stp off

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
echo -en "Creating default hostapd file...		"
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
clear
update-rc.d hostapd enable
update-rc.d dnsmasq enable
cp scripts/subnodes_ap.sh /etc/init.d/subnodes_ap
chmod 755 /etc/init.d/subnodes_ap
update-rc.d subnodes_ap defaults


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE A MESH POINT?
#
clear
echo "//////////////////////////////////////////"
echo "// Mesh Point Settings"
echo "// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo ""
echo "Please answer the following questions. Hitting return will continue with the default 'No' option"
echo ""
read -p "Do you wish to continue and set up your Raspberry Pi as a Mesh Point? [N] " yn
case $yn in
	[Yy]* )
		clear
		echo "Configuring Raspberry Pi as a BATMAN-ADV Mesh Point..."
		echo ""

		# pass the selected mesh ssid into mesh startup script
		sed -i "s/SSID/$MESH_SSID/" scripts/subnodes_mesh.sh

		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# COPY OVER THE MESH POINT START UP SCRIPT
		#
		echo ""
		echo "Adding startup script for mesh point..."
		cp scripts/subnodes_mesh.sh /etc/init.d/subnodes_mesh
		chmod 755 /etc/init.d/subnodes_mesh
		update-rc.d subnodes_mesh defaults
	;;
	[Nn]* ) ;;
esac

read -p "Do you wish to reboot now? [N] " yn
	case $yn in
		[Yy]* )
			reboot;;
		Nn]* ) exit 0;;
	esac
