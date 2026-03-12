# PiNetOS Architecture

Based on Debian Bookworm ARM64.

## Stack
- **Hardware**: Raspberry Pi 3, 4, 5
- **Bootloader**: RPi Bootloader
- **Linux Kernel**: 6.6.x LTS ARM64
- **Init**: systemd
- **PiNet Services**: Custom Go/Python daemons
- **Minima Blockchain Node**: Java-based Minima node
- **MiniDAPP Runtime**: Web-based and containerized DApps

## Core Components
- `openjdk-17-jre-headless`
- `docker.io`, `containerd`
- `wireguard`
- `k3s`
- `ipfs`
