#!/bin/bash
set -e
echo "Creating PiNetOS.img..."
dd if=/dev/zero of=PiNetOS.img bs=1M count=4096
parted PiNetOS.img --script mklabel msdos
parted PiNetOS.img --script mkpart primary fat32 4MiB 256MiB
parted PiNetOS.img --script mkpart primary ext4 256MiB 100%

# Setup loop devices and format
# mkfs.vfat /dev/loopXp1
# mkfs.ext4 /dev/loopXp2

# Mount and copy rootfs and boot files
# cp -a rootfs/* /mnt/ext4/
# cp -a boot/* /mnt/fat32/

echo "Image creation simulated."
