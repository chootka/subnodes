#!/bin/sh
# /etc/init.d/subnodes_ap
# starts up node.js app, ap0 interface, hostapd, and dnsmasq for broadcasting a wireless network with captive portal

NAME=subnodes_ap
DESC="Brings up wireless access point for connecting to web server running on the device."
DAEMON_PATH="/home/pi/subnodes"
DAEMONOPTS="sudo NODE_ENV=production PORT=80 nodemon subnode.js"
PIDFILE=/var/run/$NAME.pid
PHY="phy1"

	case "$1" in
		start)
			echo "Starting $NAME access point..."

			# associate the ap0 interface to a physical devices
			WLAN1=`iw dev | awk '/Interface/ { print $2}' | grep wlan1`
			if [ -n "$WLAN1" ] ; then
				ifdown $WLAN1
				iw $WLAN1 del

				# assign ap0 to the hardware device found
				iw phy $PHY interface add ap0 type __ap
			fi

			# bring up ap0 wireless access point interface
			ifup ap0

			# start the hostapd and dnsmasq services
			service dnsmasq start
			#service hostapd start
			hostapd -B /etc/hostapd/hostapd.conf

			# start the node.js chat application
			cd $DAEMON_PATH
			PID=`$DAEMONOPTS > /dev/null 2>&1 & echo $!`
			#echo "Saving PID" $PID " to " $PIDFILE
				if [ -z $PID ]; then
					printf "%s\n" "Fail"
				else
					echo $PID > $PIDFILE
					printf "%s\n" "Ok"
				fi
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
				cd $DAEMON_PATH
			if [ -f $PIDFILE ]; then
				kill -HUP $PID
				printf "%s\n" "Ok"
				rm -f $PIDFILE
			else
				printf "%s\n" "pidfile not found"
			fi

			ifdown ap0

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
