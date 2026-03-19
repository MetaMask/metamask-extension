# Speculos Integration for MetaMask E2E Tests

This directory contains the infrastructure for running MetaMask E2E tests with Speculos (Ledger's hardware wallet emulator) instead of physical devices.

## Architecture

```
MetaMask Extension (E2E Test)
├─ WebHID Mock → Intercepts navigator.hid calls
├─ SpeculosClient → TCP connection to Speculos
└─ APDU Exchange → Forward to emulator

Speculos Docker Container
├─ TCP Server :9999 (APDU proxy)
├─ REST API :5000 (screenshots, buttons)
└─ Ethereum App (emulated Ledger firmware)
```

## Quick Start

### 1. Download Ethereum App

```bash
yarn speculos:download
```

### 2. Start Speculos

```bash
yarn speculos:up
```

### 3. Run Tests

```bash
yarn test:e2e:speculos
```

### 4. Stop Speculos

```bash
yarn speculos:down
```

## Files

| File                        | Purpose                            |
| --------------------------- | ---------------------------------- |
| `docker-compose.yml`        | Speculos container configuration   |
| `download-ethereum-app.sh`  | Downloads Ethereum app binary      |
| `client.ts`                 | TypeScript client for Speculos API |
| `test-helper.ts`            | Test lifecycle management          |
| `speculos-hid-device.ts`    | Mock HIDDevice implementation      |
| `webhid-speculos-bridge.ts` | Injects mock WebHID into browser   |
| `ledger-speculos.spec.ts`   | Example E2E test                   |

## Configuration

Environment variables:

- `SPECULOS_HOST` - Host for Speculos (default: 127.0.0.1)
- `SPECULOS_APDU_PORT` - TCP port for APDU (default: 9999)
- `SPECULOS_API_PORT` - REST API port (default: 5000)
- `USE_SPECULOS` - Enable Speculos mode (set to 'true')

## Troubleshooting

### Speculos won't start

Check Docker is running:

```bash
docker ps
```

Check logs:

```bash
yarn speculos:logs
```

### Tests can't connect

Verify Speculos is healthy:

```bash
curl http://localhost:5000/
```

## References

- [Speculos Documentation](https://speculos.ledger.com/)
- [Ledger Developer Portal](https://developers.ledger.com/)
