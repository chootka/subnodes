#!/bin/sh
# /etc/init.d/subnodes_config_ap
# starts up ap0 interface and hostapd for broadcasting a wireless network

NAME=subnodes_config_ap
DESC="Brings up wireless access point for connecting to web server running on the device."
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME
PHY="phy0"

	case "$1" in
		start)
			echo "Running $NAME ..."
			# associate the ap0 interface to a physical devices
			# check to see if wlan1 exists; use that radio, if so.
			FOUND=`iw dev | grep phy#1`
			if  [ -n "$FOUND" ] ; then
				#WLAN="wlan1"
				PHY="phy1"
			fi

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

			# assign ap0 to the hardware device found
			iw phy $PHY interface add ap0 type __ap

			# start the hostapd and dnsmasq services
			service hostapd restart
			service dnsmasq restart

			;;
		status)
			printf "%-50s" "Checking $NAME..."
			if [ -f $PIDFILE ]; then
				PID=`cat $PIDFILE`
				if [ -z "`ps axf | grep ${PID} | grep -v grep`" ]; then
					printf "%s\n" "Process dead but pidfile exists"
				else
					echo "Running"
				fi
			else
				printf "%s\n" "Service not running"
			fi
		;;
		stop)
			printf "%-50s" "Shutting down $NAME..."
				PID=`cat $PIDFILE`
			if [ -f $PIDFILE ]; then
				kill -HUP $PID
				printf "%s\n" "Ok"
				rm -f $PIDFILE
			else
				printf "%s\n" "pidfile not found"
			fi

			ifconfig br0 down
			ifconfig bat0 down
			ifconfig ap0 down
			ifconfig wlan2 down

			service hostapd stop
            service dnsmasq stop
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
