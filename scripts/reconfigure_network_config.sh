# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOME DEFAULT VALUES
#
# BRIDGE
BRIDGE_IP=$6
BRIDGE_NETMASK=$7

# WIRELESS RADIO DRIVER
RADIO_DRIVER=nl80211

# ACCESS POINT
AP_COUNTRY=$4
AP_SSID=$3
AP_CHAN=$5

# DNSMASQ STUFF
DHCP_START=$8
DHCP_END=$9
DHCP_NETMASK=${10}
DHCP_LEASE=${11}

# MESH POINT
MESH_SSID=${13}

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE A MESH POINT?
#
case ${12} in
	[Yy]* )

		# pass the selected mesh ssid into mesh startup script
		sed -i "s/SSID/$MESH_SSID/" scripts/subnodes_mesh.sh

		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# COPY OVER THE MESH POINT START UP SCRIPT
		#
		echo ""
		echo "Adding startup script for mesh point..."
		cp scripts/subnodes_config_mesh.sh /etc/init.d/subnodes_config_mesh
		chmod 755 /etc/init.d/subnodes_config_mesh
		update-rc.d subnodes_config_mesh defaults
	;;
	[Nn]* ) ;;
esac

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CONFIGURE AN ACCESS POINT WITH CAPTIVE PORTAL?
#
case ${14} in
	[Yy]* )
		
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

# gateway wifi dongel
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
		clear
		update-rc.d hostapd enable
		update-rc.d dnsmasq enable
		cp scripts/subnodes_ap.sh /etc/init.d/subnodes_ap
		chmod 755 /etc/init.d/subnodes_ap
		update-rc.d subnodes_ap defaults
	;;

	[Nn]* ) ;;
esac