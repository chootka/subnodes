# this script modifies the network interface config file
# we are giving the Raspberry Pi a static IP address for its Access Point interface ap0

import os, sys

# make sure we have write access to the network interface config file
if not os.access("/etc/network/interfaces", os.W_OK):
    print "No write access to /etc/network/interfaces -- aborting! (must be run as root or with sudo)"
    sys.exit(1)

interface_file = open("/etc/network/interfaces", "r")
interface_lines = interface_file.readlines()
interface_file.close()
output_lines = []

# certain lines need commenting
lines_to_comment_out = [
    "allow-hotplug",
    "wpa-roam",
    "iface default",
]

# certain lines need inserting
if_lines = [
    "",
    "iface ap0 inet static",
    "  address 10.0.0.1",
    "  netmask 255.255.255.0",
    "",
    "auto br0",
    "iface br0 inet static",
    "  bridge_ports none",
    "  bridge_stp off",
    "  address 192.168.3.1",
    "  netmask 255.255.255.0",
    "",
]

editing_wlan0 = False
for line in interface_lines:

    if any(line.startswith(beginning) for beginning in lines_to_comment_out):
        line = "#" + line

    # start deleting lines where the wlan0 spec starts
    if line.startswith("iface wlan0 inet"):
        editing_wlan0 = True
        line = None
    elif editing_wlan0: # keep deleting until indented block ends
        if line.startswith(" "):
            line = None
        else:
            editing_wlan0 = False
    
    # add the line to the output list
    if line is not None:
        output_lines.append(line.rstrip())

# stick the ap0 + br0 spec onto the end of the output list
output_lines += if_lines

# join, and remove double rows of empty lines
output = "\n".join(output_lines).replace("\n\n\n", "\n\n")

# write to file
interface_file = open("/etc/network/interfaces", "w")
interface_lines = interface_file.write(output)
interface_file.close()
