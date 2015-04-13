subnodes
========

![](https://david-dm.org/chootka/subnodes.svg)

Subnodes is an open source project that enables people to easily set up a mesh node and wireless access point for serving content.
This project is an initiative focused on streamlining the process of setting up a Raspberry Pi as a wireless access
point for distributing content, media, and shared digital experiences. The device behaves as a web server, creating
its own local area network, and does not connect with the internet. This is key for the sake of offering a space
where people can communicate anonymously and freely, as well as maximizing the portability of the network
(no dependibility on an internet connection means the device can be taken and remain active anywhere). 

The device can also be enabled as a BATMAN Advanced mesh node, enabling it to join with other nearby BATMAN nodes into a greater mesh
network, extending range and making it possible to exchange information with each other. Support for Subnodes has
been provided by Eyebeam. This code is published under the [AGPLv3](http://www.gnu.org/licenses/agpl-3.0.html).

how to install
--------------
Assuming you are starting with a fresh [Raspbian](http://www.raspberrypi.org/downloads/) (Version January 2015) install on your SD card, these are the steps for installing subnodes on your Raspberry Pi. It is also assumed that you have two wireless USB adapters attached to your RPi. They both must be running the nl80211 driver.

* set up your Raspberry Pi with a basic configuration

        sudo raspi-config

* update apt-get

        sudo apt-get update

* clone the repository into your home folder (assuming /home/pi)

        git clone https://github.com/chootka/subnodes.git

* run the installation script

        cd subnodes
        sudo ./install.sh

The installation process takes about 15 minutes. You will be prompted to name your mesh network and the option to name and install a wireless access point. After it has completed, you will have a running BATMAN Advanced mesh node and will be broadcasting a wireless access point. Connecting to the network and navigating to a browser page will redirect you to http://www.hotprobs.com, where a node.js chat client will be running. 

From here, fork, build, share your ideas, and have fun!

references
----------
* [subnodes website](http://subnod.es/)
* [Raspberry Pi](http://www.raspberrypi.org/)
* [eyebeam](http://eyebeam.org/)
