#!/bin/bash
set -e

echo "Installing PiNetOS components..."

# Build OS
bash ../build-system/build-rootfs.sh
bash ../build-system/build-kernel.sh
bash ../build-system/build-image.sh

# Configure node
echo "Configuring node..."

# Enable services
sudo systemctl enable minima.service
sudo systemctl enable pinet-cluster-manager.service
sudo systemctl enable pinet-edge-runtime.service
sudo systemctl enable pinet-storage.service

# Start blockchain node
sudo systemctl start minima.service

echo "PiNetOS installation complete."
