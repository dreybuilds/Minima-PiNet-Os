#!/bin/bash
set -e

echo "Building PiNetOS Root Filesystem..."

ROOTFS_DIR="rootfs"
mkdir -p $ROOTFS_DIR

# Run debootstrap
sudo debootstrap --arch=arm64 bookworm $ROOTFS_DIR http://deb.debian.org/debian/

# Chroot and install packages
sudo chroot $ROOTFS_DIR /bin/bash -c "
  apt-get update
  apt-get install -y openjdk-17-jre-headless docker.io containerd git curl net-tools wireguard
  
  # Install k3s
  curl -sfL https://get.k3s.io | INSTALL_K3S_SKIP_ENABLE=true sh -
  
  # Install IPFS
  wget https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_linux-arm64.tar.gz
  tar -xvzf kubo_v0.28.0_linux-arm64.tar.gz
  cd kubo
  bash install.sh
"

# Create PiNet directories
sudo mkdir -p $ROOTFS_DIR/pinet/services
sudo mkdir -p $ROOTFS_DIR/pinet/dapps

echo "Root filesystem built successfully."
