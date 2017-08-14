#!/bin/sh
# /etc/init.d/subnodes_mesh
# starts up mesh0, bat0 interfaces

NAME=subnodes_mesh
DESC="Brings our BATMAN-ADV mesh point up."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

# get second PHY WLAN pair
readarray IW < <(iw dev | awk '$1~"phy#"{PHY=$1}; $1=="Interface" && $2~"wlan"{WLAN=$2; sub(/#/, "", PHY); print PHY " " WLAN}')

IW1=( ${IW[1]} )

PHY=${IW1[0]}
WLAN1=${IW1[1]}

echo $PHY $WLAN1 > /tmp/mesh.log

	case "$1" in
		start)
			echo "Starting $NAME mesh point..."

			# delete wlan1 if it exists
			if [ -n "$WLAN1" ] ; then
				ifconfig $WLAN1 down
				iw $WLAN1 del

				# associate the mesh0 interface to a physical device
				iw phy $PHY interface add mesh0 type adhoc
				# ifconfig mesh0 mtu 1532
				ifconfig mesh0 mtu MTU
				# iwconfig mesh0 mode ad-hoc essid submesh ap 02:12:34:56:78:90 channel 3
				iwconfig mesh0 mode ad-hoc essid SSID ap CELL_ID channel CHAN
			fi

			ifconfig mesh0 down

			# add the interface to batman
			batctl if add mesh0
			batctl ap_isolation 1

			# add bat0 to our bridge
			if [[ -x /sys/class/net/br0 ]]; 
				brctl addif br0 bat0
			fi

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
