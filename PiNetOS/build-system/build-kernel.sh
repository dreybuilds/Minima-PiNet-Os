#!/bin/bash
set -e
echo "Building Linux Kernel for Raspberry Pi..."
# Clone Raspberry Pi linux tree
# git clone --depth=1 -b rpi-6.6.y https://github.com/raspberrypi/linux
# cd linux
# make bcm2711_defconfig
# make -j$(nproc) Image.gz modules dtbs
echo "Kernel build simulated."
