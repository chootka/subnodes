#!/bin/bash
# /etc/init.d/subnodes_mesh
# starts up mesh0, bat0 interfaces

### BEGIN INIT INFO
# Provides:          subnodes_mesh
# Required-Start:    dbus subnodes_ap
# Required-Stop:     dbus subnodes_ap
# Should-Start:	     $syslog
# Should-Stop:       $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Subnodes MESH
# Description:       Subnodes MESH script
### END INIT INFO

NAME=subnodes_mesh
DESC="Brings our BATMAN-ADV mesh point up."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

# get second PHY WLAN pair
readarray IW < <(iw dev | awk '$1~"phy#"{PHY=$1}; $1=="Interface" && $2!="wlan0"{WLAN=$2; sub(/#/, "", PHY); print PHY " " WLAN}')

IW1=( ${IW[0]} )

PHY=${IW1[0]}
WLAN1=${IW1[1]}

echo $PHY $WLAN1 > /tmp/mesh.log

	case "$1" in
		start)
			echo "Starting $NAME mesh point on interface $PHY:$WLAN1..."

			ifconfig $WLAN1 down
			ifconfig $WLAN1 mtu MTU
			iwconfig $WLAN1 mode ad-hoc essid SSID ap CELL_ID channel CHAN

			# add the interface to batman
			batctl if add $WLAN1
			batctl ap_isolation 1

			# add bat0 to our bridge
			if [[ -x /sys/class/net/br0 ]]; then
				brctl addif br0 bat0
			fi

			# bring up the BATMAN adv interface
			ifconfig $WLAN1 up
			ifconfig bat0 up
			;;
		status)
		;;
		stop)
			ifconfig $WLAN1 down
			ifconfig bat0 down

			# batctl if del mesh0
			# ifconfig mesh0 mtu 1500
			# iwconfig mesh0 mode managed
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
