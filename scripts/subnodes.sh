#!/bin/sh
# /etc/init.d/subnodes
# starts up ap0 and mesh0, bat0 interfaces
# starts up hostapd => broadcasting wireless network subnodes
# starts up node app

#TODO move app to /usr/bin/
DAEMON_PATH="/home/pi/www/subnodes"

DAEMON=sudo
DAEMONOPTS="NODE_ENV=production nodemon subnode.js"

NAME=subnodes
DESC="Runs /home/pi/www/subnodes/subnode.js in production mode with nodemon"
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

	case "$1" in
		start)
			echo "Starting $NAME access point and mesh point..."
			# DAEMON hostapd -B /etc/hostapd/hostapd.conf
			# bring up the BATMAN adv interface
			DAEMON ifconfig mesh0 up
			DAEMON ifconfig bat0 up

			# bring up the AP interface and give ap0 a static IP
			DAEMON ifconfig ap0 10.0.0.1 netmask 255.255.255.0 up

			# bring up the brdige and assign it a static IP
			DAEMON ifconfig br0 192.168.3.1 netmask 255.255.255.0 up

			# start the hostapd and dnsmasq services
			DAEMON service hostapd start
			DAEMON service dnsmasq start

			# start the node.js chat application
			cd $DAEMON_PATH
			PID=`$DAEMON $DAEMONOPTS > /dev/null 2>&1 & echo $!`
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
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac