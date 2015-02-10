#!/bin/sh
# /etc/init.d/subnodes_mesh
# starts up mesh0, bat0 interfaces

NAME=subnodes_mesh
DESC="Brings our BATMAN-ADV mesh point up."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

	case "$1" in
		start)
			echo "Starting $NAME access point and mesh point..."

			# associate the mesh0 interface to a physical device
			# how can i grab the next avail phy device instead of hardcoding it?
			ifconfig wlan0 down
			iw wlan0 del
			iw phy phy0 interface add mesh0 type adhoc
			ifconfig mesh0 mtu 1532
			iwconfig mesh0 mode ad-hoc essid $MESH_SSID ap 02:12:34:56:78:90 channel 3
			ifconfig mesh0 down

			# add the interface to batman
			batctl if add mesh0
			batctl ap_isolation 1

			# bring up the BATMAN adv interface
			ifconfig mesh0 up
			ifconfig bat0 up
			;;
		status)
		;;
		stop)
			ifconfig mesh0 down
			ifconfig bat0 down
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
