# Speculos Integration for MetaMask E2E Tests

Ledger hardware wallet E2E tests using [Speculos](https://github.com/LedgerHQ/speculos) (emulated firmware) and the **real** `LedgerOffscreenBridge` with a mocked WebHID transport.

## Architecture

```
Extension (offscreen) → @ledgerhq/hw-transport-webhid (HID frames)
    → WebHID mock → WebSocket → ApduBridge (Node, HID deframe/reframe)
    → Speculos TCP :9998 → ethereum.elf
```

## Quick Start

```bash
# 1. Test build
yarn build:test

# 2. Run a single test file
SPECULOS_E2E=1 yarn test:e2e:single test/e2e/tests/hardware-wallets/ledger/ledger-account.spec.ts --browser=chrome

# 3. Run all Ledger tests
SPECULOS_E2E=1 yarn test:e2e:single "test/e2e/tests/hardware-wallets/ledger/ledger-account.spec.ts" "test/e2e/tests/hardware-wallets/ledger/ledger-send.spec.ts" "test/e2e/tests/hardware-wallets/ledger/ledger-error-modals.spec.ts" --browser=chrome
```

### Manual Docker (debugging)

```bash
yarn speculos:up
curl http://localhost:5001/
yarn speculos:logs
yarn speculos:down
```

### Manual dev build (interactive testing)

Load the extension in Chrome and interact with the emulated Ledger by hand:

```bash
# 1. Start Speculos emulator
yarn speculos:up

# 2. Build with speculos WebHID mock injected (watches for changes)
yarn start:test:speculos

# 3. Load dist/chrome/ as an unpacked extension (chrome://extensions → Developer mode → Load unpacked)

# 4. Unlock with password: correct horse battery staple
```

If you need the ApduBridge running standalone (the E2E runner starts it automatically, but manual testing requires it):

```bash
node -e "
  const { Speculos } = require('@metamask/hw-emulator');
  const { DEFAULT_DEVICE } = require('@metamask/hw-emulator');
  const s = new Speculos({ device: 'flex' });
  s.start().then(async () => {
    await s.startBridge(DEFAULT_DEVICE.wsBridgePort);
    await s.getInteraction().enableBlindSigning();
    console.log('Ready — bridge on ws://localhost:9876');
  });
"
```

## Test Files

| File | Tests |
|------|-------|
| `ledger-account.spec.ts` | Account connection, disconnection |
| `ledger-send.spec.ts` | ETH send (EIP-1559, legacy) |
| `ledger-error-modals.spec.ts` | Transaction rejection, account removal |
| `ledger-erc20.spec.ts` | ERC-20 token send (requires blind signing) |
| `ledger-erc721.spec.ts` | ERC-721 NFT send (requires blind signing) |
| `ledger-sign.spec.ts` | EIP-712 signing (blocked: firmware lacks INS 0x1a) |

## Button Sequences

| Operation | Sequence |
|-----------|----------|
| ETH send confirm | 6x `right` + `both` |
| ERC20/ERC721 confirm | `both` (blind sign) + 4x `right` + `both` |
| Blind signing enable | Automated via `SpeculosClient.enableBlindSigning()` |

## Ports (host)

| Service | Port |
|---------|------|
| APDU (TCP) | **9998** |
| REST API | **5001** |
| ApduBridge (WebSocket) | **9876** |

## Multi-Device Support

`DeviceConfig` allows running multiple Speculos instances with different ports:

```typescript
import { DEVICE_PRESETS, startSharedSpeculos } from './speculos';

const device0 = await startSharedSpeculos({ device: DEVICE_PRESETS[0] });
const device1 = await startSharedSpeculos({ device: DEVICE_PRESETS[1] });
```

## Screenshots

```typescript
const client = ctx.client;
const path = await client.saveScreenshot('after-signing');
// Saved to test-artifacts/speculos-screenshots/after-signing-<timestamp>.png
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SPECULOS_E2E=1` | Enable WebHID Chrome flags |
| `SPECULOS_SKIP_DOCKER_START=1` | Use existing container (CI) |
| `SKIP_SPECULOS_TESTS=true` | Skip Speculos startup |
| `SPECULOS_FAIL_FAST=true` | Fail if Docker does not start |
| `SPECULOS_HOST` | Override host (default `127.0.0.1`) |
| `SPECULOS_APDU_PORT` | Override APDU port (default `9998`) |
| `SPECULOS_API_PORT` | Override API port (default `5001`) |

## Speculos seed / addresses

Docker seed derives (see `docker-compose.yml`):

| Index | Address |
|-------|---------|
| 0 | `0xb0358b8F2314F6f6a392a4be8C7C422e631d9F63` |
| 1 | `0xE004F1e6F8bB51106fD488550f7e6e6f54430018` |
| 2 | `0xd957f2200aEDA0Ac1604d29F6C823bD113A13780` |
| 3 | `0x797b3EF4B1807c30F6831381dE79be50217B53a5` |
| 4 | `0x335Fcb7dd8d2190c9698026Df2dBa62A990371F4` |

## Files

| File | Purpose |
|------|---------|
| `build-config.ts` | Chrome flags, env validation, mock-in-build detection |
| `shared-context.ts` | `startSharedSpeculos` / `stopSharedSpeculos` (reused across `it()` blocks) |
| `with-speculos-fixtures.ts` | `withSpeculosFixtures` — per-test fixture wrapper |
| `cleanup.ts` | Orphan process / port cleanup between runs |

Core transport and device logic lives in `@metamask/hw-emulator` (`Speculos`, `ApduBridge`, `SpeculosClient`, `LedgerDeviceInteraction`, etc.).

## CI

`.github/workflows/e2e-speculos.yml` starts Docker via `run-e2e.yml` `services:` and sets `SPECULOS_SKIP_DOCKER_START=1`.

## References

- [Speculos](https://speculos.ledger.com/)
- [BRIDGE_INTEGRATION.md](./BRIDGE_INTEGRATION.md)
