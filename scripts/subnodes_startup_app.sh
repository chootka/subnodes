#!/bin/sh
# Sets startup script for webapp

NAME=subnodes_startup_app
DESC="Startup script for running installed app"
DAEMON_PATH="/home/pi/subnodes/app"
PIDFILE=/var/run/$NAME.pid
SCRIPTNAME=/etc/init.d/$NAME

	case "$1" in
		start)
			# Set background process for currently installed app
			cd $DAEMON_PATH
			# Parse package.json for npm start script
			$DAEMONOPTS=`grep -Po '(?<="start": ")[^"]*' package.json`
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
		;;

		restart)
			$0 stop
			$0 start
		;;

*)
		echo "Usage: $0 {status|start|stop|restart}"
		exit 1
esac
