# PiNetOS Deployment Guide

## Prerequisites
- Raspberry Pi 4 or 5
- MicroSD Card (16GB+ recommended)
- Linux/macOS host machine for flashing

## Installation
1. Download the `PiNetOS.img` file.
2. Flash the image to your MicroSD card using `dd` or Raspberry Pi Imager.
   ```bash
   sudo dd if=PiNetOS.img of=/dev/sdX bs=4M status=progress
   ```
3. Insert the MicroSD card into your Raspberry Pi and power it on.
4. The system will automatically resize the root partition, generate device identities, and start the Minima node.

## Post-Installation
Access the node via SSH:
```bash
ssh pi@<raspberry-pi-ip>
```
Default password is `pinet`. Please change it immediately.
