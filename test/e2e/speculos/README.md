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
| 0 | `0x3FB034C6a9F4Da3F61709dBe720033A66984caf1` |
| 1 | `0xFe20B747d3C303477ba25cA4F3D9355D7f70e859` |
| 2 | `0x137560Ff91A3c23Fec7358f7951Fcca54640286C` |
| 3 | `0x673092aEf16Fe80F1d70706542088bA70d56a958` |
| 4 | `0xE4A7f01F07f2480689dCe33B91689c60D49a3ebF` |

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Speculos container |
| `client.ts` | TCP + REST client with screenshot support |
| `apdu-bridge.ts` | WebSocket ↔ Speculos (HID framing), error injection |
| `ledger-hid-framing.ts` | `@ledgerhq/devices` HID encode/decode |
| `webhid-mock-script.ts` | In-page WebHID mock source |
| `with-speculos-fixtures.ts` | E2E fixture wrapper |
| `test-helper.ts` | Docker lifecycle |
| `constants.ts` | Ports, addresses, `DeviceConfig` |
| `shared-context.ts` | `startSharedSpeculos` / `stopSharedSpeculos` |
| `resilience.ts` | Retry / exponential backoff |
| `cleanup.ts` | Orphan process cleanup |
| `build-config.ts` | Chrome flags, env validation |

## CI

`.github/workflows/e2e-speculos.yml` starts Docker via `run-e2e.yml` `services:` and sets `SPECULOS_SKIP_DOCKER_START=1`.

## References

- [Speculos](https://speculos.ledger.com/)
- [BRIDGE_INTEGRATION.md](./BRIDGE_INTEGRATION.md)
