#!/bin/bash
set -e

echo "Running chroot setup..."

# Set hostname
echo "pinetos" > /etc/hostname
echo "127.0.0.1 localhost pinetos" >> /etc/hosts

# Configure apt
cat <<EOF > /etc/apt/sources.list
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
EOF

apt-get update
apt-get install -y locales console-setup
echo "en_US.UTF-8 UTF-8" > /etc/locale.gen
locale-gen
export LC_ALL="en_US.UTF-8"

# Install essential packages
apt-get install -y \
    sudo ssh network-manager curl wget git build-essential \
    xserver-xorg xinit openbox lightdm plymouth plymouth-themes \
    openjdk-17-jre-headless \
    libnss3 libasound2 libatk-bridge2.0-0 libgtk-3-0 libdrm2 libgbm1 \
    linux-image-arm64 linux-headers-arm64 firmware-linux-free firmware-brcm80211

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create pi user
useradd -m -s /bin/bash -G sudo,video,audio,plugdev,netdev pi
echo "pi:pinetos" | chpasswd
echo "pi ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/010_pi-nopasswd

# Setup directories
mkdir -p /opt/pinetos/app
mkdir -p /opt/minima
mkdir -p /home/pi/pinet-data
mkdir -p /home/pi/pinet-wallet
mkdir -p /home/pi/.config/openbox
chown -R pi:pi /home/pi/pinet-data /home/pi/pinet-wallet /home/pi/.config

# Copy configs
cp /tmp/config/openbox/autostart /home/pi/.config/openbox/autostart
chown pi:pi /home/pi/.config/openbox/autostart

cp /tmp/config/systemd/*.service /etc/systemd/system/
systemctl enable minima.service
systemctl enable pinet-desktop.service
systemctl enable pinet-node-monitor.service
systemctl enable NetworkManager.service
systemctl enable ssh.service

# Setup Plymouth
mkdir -p /usr/share/plymouth/themes/pinetos
cp /tmp/config/plymouth/pinetos.plymouth /usr/share/plymouth/themes/pinetos/
plymouth-set-default-theme -R pinetos

echo "Chroot setup complete."
