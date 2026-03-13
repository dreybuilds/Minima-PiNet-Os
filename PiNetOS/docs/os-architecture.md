# PiNetOS Operating System Architecture

Based on **Debian Bookworm ARM64**.

## System Stack
- **Hardware**
- **Bootloader**
- **Linux Kernel**
- **systemd**
- **PiNet Services**
- **Minima Blockchain Node**
- **MiniDAPP Runtime**

## Core Components
- **Base OS**: Debian 12 (Bookworm) minimal rootfs.
- **Container Engine**: Docker & containerd.
- **Orchestration**: k3s (Lightweight Kubernetes).
- **Storage**: IPFS for decentralized file storage.
- **Networking**: WireGuard for mesh VPN.
