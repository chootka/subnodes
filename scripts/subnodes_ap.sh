#!/bin/sh
# /etc/init.d/subnodes_ap
# starts up ap0 interface
# starts up hostapd => broadcasting wireless network subnodes

DAEMON_PATH="/home/pi/subnodes"

DAEMON=sudo

NAME=subnodes_ap
DESC="Brings up wireless access point for connecting to web server running on the device."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

	case "$1" in
		start)
			echo "Starting $NAME access point and mesh point..."
			# delete default interfaces
			$DAEMON ifconfig wlan0 down
			$DAEMON iw dev wlan0 del
			$DAEMON ifconfig wlan1 down
			$DAEMON iw dev wlan1 del

			# create the ap0 interface
			$DAEMON iw phy phy0 interface add ap0 type __ap

			# add interfaces to the bridge
			$DAEMON brctl addbr br0
			$DAEMON brctl addif br0 ap0
			$DAEMON brctl addif br0 bat0

			# bring up the AP interface and give ap0 a static IP
			# not sure if ap0 needs an IP anymore, since it is part of the bridge
			$DAEMON ifconfig ap0 10.0.0.1 netmask 255.255.255.0 up

			# bring up the brdige and assign it a static IP
			$DAEMON ifconfig br0 192.168.3.1 netmask 255.255.255.0 up

			# start the hostapd and dnsmasq services
			$DAEMON service hostapd start
			$DAEMON service dnsmasq start
			;;
		status)
		;;
		stop)
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
