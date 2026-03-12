#!/bin/bash
set -e
echo "Installing Minima..."
mkdir -p /opt/minima
wget -O /opt/minima/minima.jar https://github.com/minima-global/Minima/raw/master/jar/minima.jar
cp services/minima.service /etc/systemd/system/
systemctl enable minima
echo "Minima installed."
