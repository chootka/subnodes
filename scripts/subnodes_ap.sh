#!/bin/sh
# /etc/init.d/subnodes_ap
# starts up ap0 interface
# starts up hostapd => broadcasting wireless network subnodes

NAME=subnodes_ap
DESC="Brings up wireless access point for connecting to web server running on the device."
DAEMON_PATH="/home/pi/subnodes"
DAEMONOPTS="sudo NODE_ENV=production nodemon subnode.js"

PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME
WLAN="wlan0"
PHY="phy0"

	case "$1" in
		start)
			echo "Starting $NAME access point..."
			# bring down hostapd + dnsmasq to ensure wlan0 is brought up first
			service hostapd stop
			service dnsmasq stop
			
			# associate the ap0 interface to a physical devices
			# check to see if wlan1 exists; use that radio, if so.
			FOUND=`iw dev | awk '/Interface/ { print $2}' | grep wlan1`
			if  [ -n "$FOUND" ] ; then
				WLAN="wlan1"
				PHY="phy1"
			fi
			ifconfig $WLAN down
			iw $WLAN del
			iw phy $PHY interface add ap0 type __ap

			# add interfaces to the bridge
			brctl addbr br0
			brctl addif br0 bat0
			brctl addif br0 ap0

			# bring up the AP interface and give ap0 a static IP
			ifconfig ap0 10.0.0.1 netmask 255.255.255.0 up

			# bring up the brdige and assign it a static IP
			ifconfig br0 192.168.3.1 netmask 255.255.255.0 up

			# start the hostapd and dnsmasq services
			service hostapd start
			service dnsmasq start

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
			printf "%-50s" "Shutting down $NAME…"
				PID=`cat $PIDFILE`
				cd $DAEMON_PATH
			if [ -f $PIDFILE ]; then
				kill -HUP $PID
				printf "%s\n" "Ok"
				rm -f $PIDFILE
			else
				printf "%s\n" "pidfile not found"
			fi
			brctl delif br0 bat0
			brctl delif br0 ap0
			brctl delbr br0

			ifconfig br0 down
			ifconfig bat0 down
			ifconfig ap0 down

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
