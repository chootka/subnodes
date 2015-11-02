#!/bin/sh
# resets network configuration

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOME DEFAULT VALUES
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
# UNINSTALL
#
# remove hostapd init file
echo -en "Deleting default hostapd and configuration files...			"
rm /etc/default/hostapd
rm /etc/hostapd/hostapd.conf
echo -en "[OK]\n"

# remove dnsmasq
echo -en "Deleting dnsmasq configuration file... 			"
rm /etc/dnsmasq.conf
echo -en "[OK]\n"

# remove interfaces configuration file
echo -en "Removing network interfaces configuration file... 			"
rm /etc/network/interfaces

# Remove startup scripts and delete
echo -en "Disabling and deleting startup subnodes startup scripts... 			"
update-rc.d -f subnodes_config_mesh remove
rm /etc/init.d/subnodes_config_mesh
update-rc.d -f subnodes_config_ap remove
rm /etc/init.d/subnodes_config_ap




# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE NETWORK INTERFACES

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

# handle wifidongel for gateway to internet - Appending these lines needs to be broken out into a separate script
auto wlan2
allow-hotplug wlan2
iface wlan2 inet dhcp
wpa-conf /etc/wpa.config

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



reboot