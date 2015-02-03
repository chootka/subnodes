#!/bin/sh
# /etc/init.d/subnodes_mesh
# starts up mesh0, bat0 interfaces

#TODO move app to /usr/bin/
DAEMON_PATH="/home/pi/subnodes"

DAEMON=sudo

NAME=subnodes_mesh
DESC="Brings our BATMAN-ADV mesh point up."
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

			# create the mesh0 interface
			$DAEMON iw phy phy1 interface add mesh0 type adhoc
			$DAEMON ifconfig mesh0 mtu 1532
			$DAEMON iwconfig mesh0 mode ad-hoc essid $MESH_NETWORK ap 02:12:34:56:78:90 channel 3
			$DAEMON ifconfig mesh0 down

			# add the interface to batman
			$DAEMON batctl if add mesh0
			$DAEMON batctl ap_isolation 1

			# bring up the BATMAN adv interface
			$DAEMON ifconfig mesh0 up
			$DAEMON ifconfig bat0 up
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
