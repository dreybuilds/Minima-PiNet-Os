# PiNetOS Security Model

## Device Identity
Each node generates a unique Ed25519 keypair on first boot. The public key serves as the Node ID.

## Secure Node Registration
Nodes register to the cluster by submitting a Minima transaction containing their Node ID and WireGuard public key.

## Encrypted Networking
All cluster traffic is encrypted using WireGuard. The Cluster Manager automatically configures WireGuard peers based on the blockchain registry.
