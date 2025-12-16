# Custom RPC Tips

This document provides a few high-level tips for working with custom RPC
endpoints in the MetaMask extension.

## Use HTTPS when possible

For security and privacy reasons, prefer HTTPS endpoints over plain HTTP
whenever your infrastructure allows it. Only use HTTP for local
development or trusted internal networks.

## Check basic connectivity

Before adding a custom RPC to MetaMask, verify that the endpoint responds
to basic JSON-RPC calls such as:

```bash
curl -X POST https://your-rpc-endpoint \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
