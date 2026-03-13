# PiNetOS Security Model

## Device Identity
Each Raspberry Pi generates a unique cryptographic identity upon first boot. If a TPM (Trusted Platform Module) is available, keys are stored securely in hardware.

## Secure Node Registration
Nodes joining the PiNet cluster must authenticate using public key cryptography. The cluster manager verifies the node's identity before issuing a WireGuard configuration.

## Encrypted Networking
All internal cluster communication is routed through a WireGuard mesh VPN, ensuring end-to-end encryption and preventing eavesdropping on the local network.
