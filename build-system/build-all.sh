#!/bin/bash
set -e

echo "Starting PiNetOS Build Process..."

# 1. Build Electron App (assuming run from project root)
echo "Building Electron App for ARM64..."
cd ..
npm run electron:build -- --arm64 --linux tar.gz
cd build-system

# 2. Build Rootfs
./build-rootfs.sh

# 3. Copy Electron App to Rootfs
echo "Copying Electron App to rootfs..."
sudo mkdir -p rootfs/opt/pinetos/app
sudo tar -xzf ../dist-electron-build/PiNetOS-Desktop-*-arm64.tar.gz -C rootfs/opt/pinetos/app --strip-components=1

# 4. Build Image
./build-image.sh

echo "PiNetOS Build Complete!"
