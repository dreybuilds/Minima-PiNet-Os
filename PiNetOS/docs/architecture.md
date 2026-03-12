# PiNetOS Technical Architecture

## System Layers
1. **Hardware**: Raspberry Pi 3/4/5
2. **Bootloader**: EEPROM / U-Boot
3. **Linux Kernel**: Custom compiled ARM64 kernel with WireGuard and TPM support
4. **systemd**: Init system managing PiNet services
5. **PiNet Services**: Cluster Manager, Edge Runtime, Storage
6. **Minima Blockchain Node**: Layer 1 decentralized network
7. **MiniDAPP Runtime**: Execution environment for decentralized apps

## Service Dependencies
- `minima.service` requires `network-online.target`
- `pinet-cluster-manager.service` requires `minima.service` and `wireguard`
- `pinet-edge-runtime.service` (k3s) requires `containerd`
- `pinet-storage.service` (IPFS) requires `network-online.target`

## Runtime Process Tree
```
systemd
 ├── containerd
 ├── k3s-server / k3s-agent
 ├── minima (java -jar minima.jar)
 ├── ipfs daemon
 └── pinet-cluster-manager
```

## Network Architecture
- **Underlay**: Physical Ethernet / Wi-Fi
- **Overlay**: WireGuard Mesh Network (10.42.0.0/16)
- **Service Discovery**: libp2p mDNS and DHT
- **Blockchain**: Minima P2P protocol (Port 9001)

## Security Model
- **Device Identity**: Hardware-backed (TPM 2.0 if available, or secure enclave)
- **Node Registration**: Cryptographic handshake via Minima transactions
- **Encrypted Networking**: All inter-node traffic routed through WireGuard
