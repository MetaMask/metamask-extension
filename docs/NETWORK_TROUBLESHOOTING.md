# Network troubleshooting behind proxies and firewalls

Some users experience connectivity issues when MetaMask is used behind corporate proxies or firewalls.

## Common symptoms

- Extension cannot connect to RPC endpoints.
- Transactions remain pending indefinitely.
- Snaps or plugins fail to load.

## Solutions

1. Whitelist MetaMask domains and RPC endpoints in your proxy.
2. Set environment variables (e.g. `HTTP_PROXY`, `HTTPS_PROXY`) before building the extension.
3. Use a VPN if your network blocks WebSocket connections.

Please share feedback in the MetaMask Discord if these steps do not help.
