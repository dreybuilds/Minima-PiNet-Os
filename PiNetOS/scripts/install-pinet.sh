#!/bin/bash
set -e
echo "Starting PiNetOS Master Installer..."

# 1. Build OS (Simulated)
./build-system/build-rootfs.sh

# 2. Configure Node
echo "Configuring Node Identity..."
# Generate keys...

# 3. Enable Services
echo "Enabling PiNet Services..."
systemctl enable pinet-edge-runtime
systemctl enable pinet-storage
systemctl enable pinet-node-agent

# 4. Start Blockchain Node
./scripts/install-minima.sh
systemctl start minima

echo "PiNetOS Installation Complete!"
