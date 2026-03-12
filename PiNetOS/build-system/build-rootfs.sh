#!/bin/bash
set -e

TARGET_DIR="rootfs"
DISTRO="bookworm"
ARCH="arm64"

echo "Building rootfs for $DISTRO ($ARCH)..."
sudo debootstrap --arch=$ARCH $DISTRO $TARGET_DIR http://deb.debian.org/debian/

echo "Installing required packages..."
sudo chroot $TARGET_DIR apt-get update
sudo chroot $TARGET_DIR apt-get install -y openjdk-17-jre-headless docker.io containerd git curl net-tools wireguard

echo "Installing k3s..."
sudo chroot $TARGET_DIR curl -sfL https://get.k3s.io | INSTALL_K3S_SKIP_ENABLE=true sh -

echo "Installing IPFS..."
sudo chroot $TARGET_DIR wget https://dist.ipfs.tech/kubo/v0.27.0/kubo_v0.27.0_linux-arm64.tar.gz
sudo chroot $TARGET_DIR tar -xvzf kubo_v0.27.0_linux-arm64.tar.gz
sudo chroot $TARGET_DIR bash -c "cd kubo && ./install.sh"

echo "Creating PiNet directories..."
sudo chroot $TARGET_DIR mkdir -p /pinet/services /pinet/dapps /opt/minima

echo "Rootfs build complete."
