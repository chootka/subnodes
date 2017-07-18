#!/bin/sh
# /etc/init.d/subnodes_mesh
# starts up mesh0, bat0 interfaces

NAME=subnodes_mesh
DESC="Brings our BATMAN-ADV mesh point up."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME
PHY="phy2"

	case "$1" in
		start)
			echo "Starting $NAME mesh point..."

			# delete wlan2 if it exists
			WLAN2=`iw dev | awk '/Interface/ { print $2}' | grep wlan2`
			if [ -n "$WLAN2" ] ; then
				ifconfig $WLAN2 down
				iw $WLAN2 del

				# associate the mesh0 interface to a physical device
				iw phy $PHY interface add mesh0 type adhoc
				ifconfig mesh0 mtu 1532
				iwconfig mesh0 mode ad-hoc essid SSID ap 02:12:34:56:78:90 channel 3
			fi

			ifconfig mesh0 down

			# add the interface to batman
			batctl if add mesh0
			batctl ap_isolation 1

			# bring up the BATMAN adv interface
			ifup mesh0
			ifup bat0
			;;
		status)
		;;
		stop)
			ifdown mesh0
			ifdown bat0
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
