#!/bin/bash
set -e

echo "Building PiNetOS Root Filesystem..."

ROOTFS_DIR="rootfs"
ARCH="arm64"
RELEASE="bookworm"

if [ -d "$ROOTFS_DIR" ]; then
    sudo rm -rf "$ROOTFS_DIR"
fi

mkdir -p "$ROOTFS_DIR"

# 1. Base OS with debootstrap
sudo debootstrap --arch=$ARCH --foreign $RELEASE $ROOTFS_DIR http://deb.debian.org/debian/

# 2. Copy qemu-aarch64-static for chroot
sudo cp /usr/bin/qemu-aarch64-static $ROOTFS_DIR/usr/bin/

# 3. Second stage debootstrap
sudo chroot $ROOTFS_DIR /debootstrap/debootstrap --second-stage

# 4. Copy chroot setup script
sudo cp chroot-setup.sh $ROOTFS_DIR/
sudo cp -r config $ROOTFS_DIR/tmp/config

# 5. Run chroot setup
sudo chroot $ROOTFS_DIR /bin/bash /chroot-setup.sh

# 6. Cleanup
sudo rm $ROOTFS_DIR/chroot-setup.sh
sudo rm -rf $ROOTFS_DIR/tmp/config
sudo rm $ROOTFS_DIR/usr/bin/qemu-aarch64-static

echo "Root filesystem built successfully."
