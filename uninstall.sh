#! /bin/bash
#
# Subnodes uninstall script. Removes dnsmasq, hostapd, bridge-utils, batctl, iw. Does *not* yet remove Node.js. Deletes subnoes folder and files within.
# Sarah Grant
# Updated 16 April 2015
#
# TO-DO
# - Remove node.js
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script *must* be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Uninstall Subnodes
#
read -p "Do you wish to uninstall subnodes from your Raspberry Pi? Hitting return will continue with the default 'No' option and exit this script." yn
case $yn in
	[Yy]* )
		clear
		echo "Disabling the batman-adv kernel..."
		# remove the batman-adv module to be started on boot
		#sed -i '$a batman-adv' /etc/modules
		modprobe -r batman-adv;
		echo ""

		echo -en "Disabling hostapd and dnsmasq on boot... 			"
		update-rc.d hostapd disable
		update-rc.d dnsmasq disable

		# remove hostapd init file
		echo -en "Deleting default hostapd and configuration files...			"
		rm /etc/default/hostapd
		rm /etc/hostapd/hostapd.conf
		echo -en "[OK]\n"

		# remove dnsmasq
		echo -en "Deleting dnsmasq configuration file... 			"
		rm /etc/dnsmasq.conf
		echo -en "[OK]\n"

		echo ""
		echo -en "Purging iw, batctl, bridge-utils, hostapd and dnsmasq... 			"
		# how do i uninstall with apt-get
		apt-get purge -y bridge-utils hostapd dnsmasq batctl iw
		echo -en "[OK]\n"

		# restore the previous interfaces file
		echo -en "Restoring previous network interfaces configuration file... 			"
		rm /etc/network/interfaces
		mv /etc/network/interfaces.bak /etc/network/interfaces
		echo -en "[OK]\n"

		# Remove startup scripts and delete
		echo -en "Disabling and deleting startup subnodes startup scripts... 			"
		update-rc.d -f subnodes_mesh remove
		rm /etc/init.d/subnodes_mesh
		update-rc.d -f subnodes_ap remove
		rm /etc/init.d/subnodes_ap

		echo "Deleting subnodes folder			"
		cd /home/pi/
		rm -rf /home/pi/subnodes
		echo -en "[OK]\n";
esac

exit 0
