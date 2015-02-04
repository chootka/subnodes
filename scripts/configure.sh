#! /bin/bash
#
# Raspberry Pi network configuration / AP, MESH install script
# Sarah Grant
# Updated 3 Feb 2015
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# DEFAULT VALUES
#
# BRIDGE
BRIDGE_IP=192.168.3.1
BRIDGE_NETMASK=255.255.255.0
# WIRELESS RADIO DRIVER
RADIO_DRIVER=rt1871xdrv
#RADIO_DRIVER=nl80211

# ACCESS POINT
AP_COUNTRY=US
AP_SSID=subnodes
AP_CHAN=1

# DNSMASQ STUFF
DHCP_START=192.168.3.2
DHCP_END=192.168.3.254
DHCP_NETMASK=255.255.255.0
DHCP_LEASE=12h

# MESH POINT
MESH_SSID=meshnode

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script MUST be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1

# CHECK USB WIFI HARDWARE IS FOUND
# LATER UPDATE THIS TO NL80211... NOT SURE RTL8188CUS CAN SUPPORT MESH
# also, i will need to check for one device per network config for a total of two devices
if [[ -n $(lsusb | grep RTL8188CUS) ]]; then
    echo "The RTL8188CUS device has been successfully located."
else
    echo "The RTL8188CUS device has not been located, check it is inserted and run script again when done."
    exit 1
fi

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
echo "Updating apt-get and installing iw package for network interface configuration..."
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOFTWARE INSTALL
#
# update the packages (may take a long time if upgrade is uncommented)
apt-get update
apt-get install -y iw
#&& sudo apt-get -y upgrade

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CAPTURE USER INPUT
#
echo "Welcome to Subnodes!"
echo "/ / / / / / / / / / / / / /"
echo ""
echo ""

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE AN ACCESS POINT WITH CAPTIVE PORTAL?
#
echo "Access Point Settings"
echo "/ / / / / / / / / / / / / /"
echo "Please answer the following question."
echo "Hitting return will continue with the default 'No' option"
echo ""
read -p "Do you wish to continue and set up your Raspberry Pi as an Access Point? " yn
case $yn in
	[Yy]* )
		clear
		echo "Configuring Raspberry Pi as Access Point..."
		echo ""
		
		#check that iw list fails with 'nl80211 not found'
		echo -en "iw list check 							"
		iw list > /dev/null 2>&1 | grep 'nl80211 not found'
		rc=$?
		if [[ $rc = 0 ]] ; then
			echo -en "[FAIL]\n"
			echo ""
			echo "Make sure you are using a wifi radio that runs off the rt1871xdrv driver."
			exit $rc
		else
			echo -en "[OK]\n"
		fi

		# install required packages
		echo -en "Installing bridge-utils, hostapd and dnsmasq... 							"
		apt-get install -y bridge-utils hostapd dnsmasq
		echo -en "[OK]\n"

		# ask how they want to configure their access point
		read -p "Wifi Country [$AP_COUNTRY]: " -e t1
		if [ -n "$t1" ]; then AP_COUNTRY="$t1";fi

		read -p "Wifi Channel Name [$AP_CHAN]: " -e t1
		if [ -n "$t1" ]; then AP_CHAN="$t1";fi

		read -p "Wifi SSID [$AP_SSID]: " -e t1
		if [ -n "$t1" ]; then AP_SSID="$t1";fi

		read -p "Bridge IP [$BRIDGE_IP]: " -e t1
		if [ -n "$t1" ]; then BRIDGE_IP="$t1";fi

		read -p "Bridge Subnet Mask [$BRIDGE_NETMASK]: " -e t1
		if [ -n "$t1" ]; then AP_CHAN="$t1";fi

		read -p "DHCP starting address [$DHCP_START]: " -e t1
		if [ -n "$t1" ]; then DHCP_START="$t1";fi

		read -p "DHCP ending address [$DHCP_END]: " -e t1
		if [ -n "$t1" ]; then DHCP_END="$t1";fi

		read -p "DHCP netmask [$DHCP_NETMASK]: " -e t1
		if [ -n "$t1" ]; then DHCP_NETMASK="$t1";fi

		read -p "DHCP length of lease [$DHCP_LEASE]: " -e t1
		if [ -n "$t1" ]; then DHCP_LEASE="$t1";fi
		
		# create hostapd init file
		echo -en "Creating default hostapd file... 							"
		cat << EOF > /etc/default/hostapd
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
		echo "Done."
		echo ""

		# create hostapd configuration with user's settings
		echo -en "Creating hostapd.conf file... 							"
		cat << EOF > /etc/hostapd/hostapd.conf
			interface=ap0
			brdige=br0
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
		
		echo ""
		# backup the existing interfaces file
		echo -en "Creating backup of original network interfaces configuration file... 							"
		cp /etc/network/interfaces /etc/network/interfaces.bak
		rc=$?
		if [[ $rc != 0 ]] ; then
			echo -en "[FAIL]\n"
			echo ""
			exit $rc
		else
			echo -en "[OK]\n"
		fi

		echo "Done.\n"
		echo ""

		# CONFIGURE /etc/network/interfaces
		echo -en "Creating new network interfaces configuration file with your settings... 							"
		cat << EOF > /etc/network/interfaces
			auto lo
			auto br0
			iface br0 inet static
				bridge_ports none
				bridge_stp off
				address $BRIDGE_IP
				netmask $BRIDGE_NETMASK
			allow-hotplug eth0
			iface eth0 inet dhcp
			iface ap0 inet static
				address 10.0.0.1
				netmask 255.255.255.0
		EOF
		rc=$?
		if [[ $rc != 0 ]] ; then
    			echo -en "[FAIL]\n"
			echo ""
			exit $rc
		else
			echo -en "[OK]\n"
		fi
		echo "Done.\n"
		echo ""

		# CONFIGURE dnsmasq
		echo -en "Creating dnsmasq configuration file... 							"
		cat << EOF > /etc/dnsmasq.conf
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
		echo "Done.\n"
		echo ""
		
		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# CREATE THE ACCESS POINT START UP SCRIPT
		#

	break;;

	[Nn]* ) break;;

	* ) echo "Please answer Yes or No";;
esac

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE A MESH POINT?
#
	echo ""
	echo ""
	echo "Mesh Point Settings"
	echo "/ / / / / / / / / / / / / /"

read -p "Do you wish to continue and set up your Raspberry Pi as a Mesh Point? " yn
case $yn in
	[Yy]* )
		clear
		echo "Configuring Raspberry Pi as a BATMAN-ADV Mesh Point..."
		echo ""
		echo "Enabling the batman-adv kernel..."
		
		# add the batman-adv module to be started on boot
		sed -i '$a batman-adv' /etc/modules
		modprobe batman-adv;

		echo "Installing batctl, iw packages..."

		# install batman-adv control interface
		apt-get install -y batctl

		# ask how they want to configure their mesh point
		read -p "Mesh Point SSID [$MESH_SSID]: " -e t1
		if [ -n "$t1" ]; then MESH_SSID="$t1";fi

		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# CREATE THE MESH POINT START UP SCRIPT
		#
	break;;

	[Nn]* ) break;;

	* ) echo "Please answer Yes or No";;
esac

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# RESTART ALL THE SERVICES
#
	echo "****** CONFIGURATION COMPLETE ******"
	# set the hostapd and dnsmasq services to autostart on boot up
	update-rc.d hostapd enable
	update-rc.d dnsmasq enable
	echo "The services will now be restarted to activate the changes"
	read -p "Press [Enter] key to restart services..."
	/etc/init.d/networking restart
	/etc/init.d/hostapd restart
	#/etc/init.d/ restart

	# subnodes_ap script configures and starts access point on boot
	#cp scripts/subnodes.sh /etc/init.d/subnodes_ap
	#chmod 755 /etc/init.d/subnodes_ap
	#update-rc.d subnodes_ap defaults
	#/etc/init.d/subnodes_ap restart

# exit script; config complete
else
	echo "exiting..."
fi
exit 0
