#!/bin/sh
# /etc/init.d/subnode
# starts up wlan0 interface and batman-adv
# starts up node apps

	case "$1" in
		start)
			echo "starting subnode!"
			#sudo insmod /lib/modules/3.2.27+/kernel/net/batman-adv/batman-adv.ko
			#sudo /sbin/ifdown wlan0
			#sudo batctl if add wlan0
			#sudo ifconfig bat0 up
			#sudo /sbin/ifup wlan0
			#sudo /etc/init.d/dnsmasq restart
		       #sudo /etc/init.d/hostapd restart
			sudo hostapd -B /etc/hostapd/hostapd.conf
			cd www
			NODE_ENV=production nodemon subnode.js
			;;
		stop)
			echo "shutting down subnode…"
			;;
		*)
			echo "Usage: /etc/init.d/subnode {start | stop}"
			exit 1
			;;
esac

exit 0