#!/bin/sh
# /etc/init.d/subnodes_config_mesh
# starts up mesh0, bat0 interfaces

NAME=subnodes_config_mesh
DESC="Brings our BATMAN-ADV mesh point up."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME
CONFIG_FILE=/etc/subnodes.config
PHY="phy0"


	case "$1" in
		start)
			echo "Starting $NAME mesh point..."
			# load config file
			. $CONFIG_FILE

			# delete wlan0 and wlan1, if they exist
			WLAN0=`iw dev | awk '/Interface/ { print $2}' | grep wlan0`
			if [ -n "$WLAN0" ] ; then
				ifconfig $WLAN0 down
				iw $WLAN0 del
			fi

			WLAN1=`iw dev | awk '/Interface/ { print $2}' | grep wlan1`
			if [ -n "$WLAN1" ] ; then
				ifconfig $WLAN1 down
				iw $WLAN1 del
			fi

			# associate the mesh0 interface to a physical device
			iw phy $PHY interface add mesh0 type adhoc
			ifconfig mesh0 mtu $MTU
			iwconfig mesh0 mode ad-hoc essid $MESH_SSID ap $CELL_ID channel $MESH_CHANNEL
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
			ifconfig wlan2 down
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
