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

# 2. Run Speculos E2E tests (starts Docker + bridge automatically)
yarn test:e2e:speculos
```

### Manual Docker (debugging)

```bash
yarn speculos:up
curl http://localhost:5001/
yarn speculos:logs
yarn speculos:down
```

## Yarn Scripts

| Script | Description |
|--------|-------------|
| `yarn speculos:up` | Start Docker container |
| `yarn speculos:down` | Stop Docker container |
| `yarn speculos:logs` | Follow container logs |
| `yarn test:e2e:speculos` | Run `@speculos` Ledger E2E tests |

## Ports (host)

| Service | Port |
|---------|------|
| APDU (TCP) | **9998** |
| REST API | **5001** |
| ApduBridge (WebSocket) | **9876** (dynamic if busy) |

Port 9999 is reserved for the phishing-warning test server — do not map Speculos to 9999.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SPECULOS_E2E=1` | Enable WebHID Chrome flags (set by `yarn test:e2e:speculos`) |
| `SPECULOS_SKIP_DOCKER_START=1` | Use existing container (CI after `docker-compose up`) |
| `SKIP_SPECULOS_TESTS=true` | Skip Speculos startup |
| `SPECULOS_FAIL_FAST=true` | Fail if Docker does not start |
| `SPECULOS_HOST` | Override host (default `127.0.0.1`) |
| `SPECULOS_APDU_PORT` | Override APDU port (default `9998`) |
| `SPECULOS_API_PORT` | Override API port (default `5001`) |

## Speculos seed / addresses

Docker seed (see `docker-compose.yml`) derives the same first account as `KNOWN_PUBLIC_KEY_ADDRESSES[0]` in `test/stub/keyring-bridge.js`:

- `0x3FB034C6a9F4Da3F61709dBe720033A66984caf1`

Use `FixtureBuilderV2().withLedgerAccount()` for pre-connected Speculos signing tests.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Speculos container |
| `client.ts` | TCP + REST client |
| `apdu-bridge.ts` | WebSocket ↔ Speculos (HID framing) |
| `ledger-hid-framing.ts` | `@ledgerhq/devices` HID encode/decode |
| `webhid-mock-script.js` | In-page WebHID mock source |
| `with-speculos-fixtures.ts` | E2E fixture wrapper |
| `test-helper.ts` | Docker lifecycle |
| `automation.ts` | Button press / auto-approve |
| `constants.ts` / `constants.js` | Ports and addresses |

## CI

`.github/workflows/e2e-speculos.yml` starts Docker via `run-e2e.yml` `services:` and sets `SPECULOS_SKIP_DOCKER_START=1` so tests only start the ApduBridge.

## References

- [Speculos](https://speculos.ledger.com/)
- [BRIDGE_INTEGRATION.md](./BRIDGE_INTEGRATION.md)
