# PiNetOS Cluster Guide

## Forming a Cluster
1. Choose one node to act as the initial cluster seed.
2. On the seed node, run:
   ```bash
   pinet-cluster init
   ```
3. This will output a join token.
4. On other nodes, run:
   ```bash
   pinet-cluster join <seed-ip> <join-token>
   ```

## Workload Scheduling
PiNetOS uses k3s for edge compute. You can deploy standard Kubernetes manifests to the cluster. The `pinet-edge-runtime` service ensures workloads are distributed across available nodes.
