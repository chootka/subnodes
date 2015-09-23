#!/bin/sh
# Changes wpa file for wlan2 to log in

cat > /etc/wpa.config << EOF

network={
    ssid=$2
    proto=RSN
    key_mgmt=WPA-PSK
    pairwise=CCMP TKIP
    group=CCMP TKIP
    psk=$3
}

EOF