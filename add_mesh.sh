#! /bin/bash
#
# Raspberry Pi Mesh Point configuration
# Author: Sarah Grant
# Updated 15 August 2017
#
# TO-DO
# - fix addressing to avoid collisions below w/avahi
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# LOAD CONFIG FILE WITH USER OPTIONS
#
#  READ configuration file
. ./subnodes.config





# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script *must* be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1





# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# BEGIN INSTALLATION PROCESS
#

clear
echo "////////////////////////"
echo "// Subnodes Mesh Point"
echo "// ~~~~~~~~~~~~~~~~~~~~"
echo ""

read -p "This installation script will add a mesh point to your Subnodes set up. It is assumed that you have already installed a Subnodes access point and now wish to add a mesh point. Make sure you plugged a second wireless radio into your Raspberry Pi. Press any key to continue..."
echo ""
clear




# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK THAT REQUIRED RADIOS ARE AVAILABLE FOR AP & MESH POINT [IF SELECTED]
#
# check that iw list does not fail with 'nl80211 not found'
case $DO_SET_MESH in
	[Yy]* )
		echo -en "Checking that USB wifi radio is available for mesh point..."
		readarray IW < <(iw dev | awk '$1~"phy#"{PHY=$1}; $1=="Interface" && $2!="wlan0"{WLAN=$2; sub(/#/, "", PHY); print PHY " " WLAN}')

		if [[ -z $IW ]] ; then
			echo -en "[FAIL]\n"
			echo "Warning! Second wireless adapter not found! Please plug in an addition wireless radio after installation completes and before reboot."
			echo "Installation process will proceed in 5 seconds..."
			sleep 5
		else
			echo -en "[OK]\n"
		fi
;;
esac

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE A MESH POINT?

clear
echo "Checking whether to configure mesh point or not..."





# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# 	DO CONFIGURE MESH POINT
#

case $DO_SET_MESH in
	[Yy]* )
		clear
		echo "Configuring Raspberry Pi as a BATMAN-ADV mesh point..."
		echo ""
		echo "Enabling the batman-adv kernel module..."
		# add the batman-adv module to be started on boot
		sed -i '$a batman-adv' /etc/modules
		modprobe batman-adv;

		# pass custom params into mesh startup script
		sed -i "s/MTU/$MTU/" scripts/subnodes_mesh.sh
		sed -i "s/SSID/$MESH_SSID/" scripts/subnodes_mesh.sh
		sed -i "s/CELL_ID/$CELL_ID/" scripts/subnodes_mesh.sh
		sed -i "s/CHAN/$MESH_CHANNEL/" scripts/subnodes_mesh.sh

		# configure dnsmasq
		echo -en "Creating dnsmasq configuration file..."
		cat <<EOF > /etc/dnsmasq.conf
interface=br0
address=/#/$BRIDGE_IP
address=/apple.com/0.0.0.0
dhcp-range=$BR_DHCP_START,$BR_DHCP_END,$DHCP_NETMASK,$DHCP_LEASE
EOF
	rc=$?
	if [[ $rc != 0 ]] ; then
    		echo -en "[FAIL]\n"
		echo ""
		exit $rc
	else
		echo -en "[OK]\n"
	fi

		# create new /etc/network/interfaces
		echo -en "Creating new network interfaces with your settings..."
		cat <<EOF > /etc/network/interfaces
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp

auto wlan0
iface wlan0 inet static
address $AP_IP
netmask $AP_NETMASK

auto br0
iface br0 inet static
address $BRIDGE_IP
netmask $BRIDGE_NETMASK
bridge_ports bat0 wlan0
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

		# create hostapd configuration with user's settings
		echo -en "Creating hostapd.conf file..."
		cat <<EOF > /etc/hostapd/hostapd.conf
interface=wlan0
bridge=br0
driver=$RADIO_DRIVER
country_code=$AP_COUNTRY
ctrl_interface=/var/run/hostapd
ctrl_interface_group=0
ssid=$AP_SSID
hw_mode=g
channel=$AP_CHAN
auth_algs=1
wpa=0
ap_isolate=1
macaddr_acl=0
wmm_enabled=1
ieee80211n=1
EOF
		rc=$?
		if [[ $rc != 0 ]] ; then
			echo -en "[FAIL]\n"
			exit $rc
		else
			echo -en "[OK]\n"
		fi

		# COPY OVER MESH START UP SCRIPT
		echo ""
		echo "Adding mesh startup script to init.d..."
		cp scripts/subnodes_mesh.sh /etc/init.d/subnodes_mesh
		chmod 755 /etc/init.d/subnodes_mesh
		update-rc.d subnodes_mesh defaults
	;;

	[Nn]* ) 
	# if no mesh point is created, set up network interfaces, hostapd and dnsmasq to operate without a bridge
		clear
		
		# configure dnsmasq
		echo -en "Oops, did you set the DO_SET_MESH flag to 'y' in subnodes.config?"
		exit 0;
	;;
esac

read -p "Do you wish to reboot now? [N] " yn
	case $yn in
		[Yy]* )
			reboot;;
		[Nn]* ) exit 0;;
	esac
