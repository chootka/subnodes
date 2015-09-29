#!/bin/sh
# reconfigure network

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Defaults
#

MESH_SSID=$2


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Configure Mesh Point
#

sed -i "s/SSID/$MESH_SSID/" subnodes_config_mesh.sh

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# COPY OVER THE MESH POINT START UP SCRIPT
#
echo ""
echo "Adding startup script for mesh point..."
cp scripts/subnodes_config_mesh.sh /etc/init.d/subnodes_config_mesh
chmod 755 /etc/init.d/subnodes_config_mesh
update-rc.d subnodes_config_mesh defaults
