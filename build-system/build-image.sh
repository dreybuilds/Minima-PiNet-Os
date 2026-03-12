#!/bin/bash
set -e

echo "Building PiNetOS Image..."

IMAGE_NAME="PiNetOS-RaspberryPi.img"
IMAGE_SIZE="4G"

# Create empty image file
fallocate -l $IMAGE_SIZE $IMAGE_NAME

# Partition the image (boot: 256MB FAT32, rootfs: remaining EXT4)
parted -s $IMAGE_NAME mklabel msdos
parted -s $IMAGE_NAME mkpart primary fat32 1MiB 256MiB
parted -s $IMAGE_NAME mkpart primary ext4 256MiB 100%

# Setup loop devices
LOOP_DEV=$(sudo losetup -fP --show $IMAGE_NAME)
BOOT_DEV="${LOOP_DEV}p1"
ROOT_DEV="${LOOP_DEV}p2"

# Format partitions
sudo mkfs.vfat -F 32 -n BOOT $BOOT_DEV
sudo mkfs.ext4 -L rootfs $ROOT_DEV

# Mount partitions
mkdir -p mnt/root
sudo mount $ROOT_DEV mnt/root
sudo mkdir -p mnt/root/boot
sudo mount $BOOT_DEV mnt/root/boot

# Copy rootfs
echo "Copying root filesystem..."
sudo cp -a rootfs/* mnt/root/

# Setup fstab
cat <<EOF | sudo tee mnt/root/etc/fstab
PARTUUID=$(sudo blkid -s PARTUUID -o value $ROOT_DEV)  /               ext4    defaults,noatime  0       1
PARTUUID=$(sudo blkid -s PARTUUID -o value $BOOT_DEV)  /boot           vfat    defaults          0       2
EOF

# Setup cmdline.txt
echo "console=serial0,115200 console=tty1 root=PARTUUID=$(sudo blkid -s PARTUUID -o value $ROOT_DEV) rootfstype=ext4 fsck.repair=yes rootwait quiet splash plymouth.ignore-serial-consoles" | sudo tee mnt/root/boot/cmdline.txt

# Unmount and cleanup
sudo umount mnt/root/boot
sudo umount mnt/root
sudo losetup -d $LOOP_DEV
rmdir mnt/root
rmdir mnt

echo "Image built successfully: $IMAGE_NAME"
