# Running Speculos Locally for Manual Testing

Speculos is an emulated Ledger hardware wallet. This guide covers starting it locally and testing the MetaMask extension against it.

## Prerequisites

- Docker running
- Test build of MetaMask: `yarn build:test`

## Starting Speculos by Device Model

### Nano S+ (default)

```bash
yarn speculos:up
```

### Nano X

```bash
SPECULOS_DEVICE=nanox SPECULOS_ELF_FILENAME=ethereum-nanox.elf yarn speculos:up
```

### Stax (touchscreen)

```bash
SPECULOS_DEVICE=stax SPECULOS_ELF_FILENAME=ethereum-stax.elf yarn speculos:up
```

### Flex (touchscreen)

```bash
SPECULOS_DEVICE=flex SPECULOS_ELF_FILENAME=ethereum-flex.elf yarn speculos:up
```

## Verifying It's Running

```bash
curl http://localhost:5001/
```

Open `http://localhost:5001` in a browser to see the device screen and interact with it (buttons for Nano, touchscreen for Stax/Flex).

## Running E2E Tests Against Speculos

```bash
SPECULOS_E2E=1 yarn test:e2e:single test/e2e/tests/hardware-wallets/ledger/ledger-account.spec.ts --browser=chrome
```

For multiple test files:

```bash
SPECULOS_E2E=1 yarn test:e2e:single \
  "test/e2e/tests/hardware-wallets/ledger/ledger-account.spec.ts" \
  "test/e2e/tests/hardware-wallets/ledger/ledger-send.spec.ts" \
  "test/e2e/tests/hardware-wallets/ledger/ledger-error-modals.spec.ts" \
  --browser=chrome
```

With `--leave-running` to keep the browser open for manual inspection after tests:

```bash
SPECULOS_E2E=1 yarn test:e2e:single test/e2e/tests/hardware-wallets/ledger/ledger-account.spec.ts --browser=chrome --leave-running --debug
```

## Ports

| Service | Port |
|---------|------|
| APDU (TCP) | 9998 |
| REST API / Web UI | 5001 |
| ApduBridge (WebSocket) | 9876 |

## Useful Commands

```bash
yarn speculos:logs   # View container logs
yarn speculos:down   # Stop and remove container
```

## Available Device Models

| Model | Device | Interaction | ELF File |
|-------|--------|-------------|----------|
| `nanosp` | Nano S+ | Buttons | `ethereum-nanosp.elf` |
| `nanox` | Nano X | Buttons | `ethereum-nanox.elf` |
| `stax` | Stax | Touchscreen | `ethereum-stax.elf` |
| `flex` | Flex | Touchscreen | `ethereum-flex.elf` |

## Test Accounts

Derived from the seed in `docker-compose.yml`:

| Index | Address |
|-------|---------|
| 0 | `0x24fC293546A31F5Ce73bAfecE37969A95CCd1aBf` |
| 1 | `0x730A5c73bC3ACcf56daba2D5D897bEb10F852865` |
| 2 | `0x805c2797CCBa57887F5fA0DD95C017145d67604a` |
| 3 | `0x2Bf9972F600D8C3B3f0AEe8f1e17Fc4631242fF4` |
| 4 | `0xDc660e6D52F6f774d0879f99929711155Bc03902` |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SPECULOS_DEVICE` | Device model (`nanosp`, `nanox`, `stax`, `flex`) |
| `SPECULOS_ELF_FILENAME` | ELF binary filename inside `/speculos/apps/` |
| `SPECULOS_E2E=1` | Enable WebHID Chrome flags for E2E tests |
| `SPECULOS_SKIP_DOCKER_START=1` | Use existing container (CI) |
| `SPECULOS_VERBOSE=true` | Verbose ApduBridge logging |
| `SPECULOS_HOST` | Override host (default `127.0.0.1`) |
| `SPECULOS_APDU_PORT` | Override APDU port (default `9998`) |
| `SPECULOS_API_PORT` | Override API port (default `5001`) |

## Programmatic Device Interaction

The Speculos REST API (port 5001) and TCP APDU interface (port 9998) allow you to programmatically control the emulated device. The project provides two layers of abstraction.

### REST API (curl)

You can interact with the device directly via HTTP without writing any code:

#### Button Presses (Nano S+ / Nano X)

```bash
# Press right button
curl -X POST http://localhost:5001/button/right \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release"}'

# Press left button
curl -X POST http://localhost:5001/button/left \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release"}'

# Press both buttons (confirm)
curl -X POST http://localhost:5001/button/both \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release"}'
```

#### Touch Events (Stax / Flex)

```bash
# Tap at coordinates
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":606,"delay":0.1}'

# Swipe from (x1,y1) to (x2,y2)
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":336,"x2":190,"y2":336,"delay":0.3}'
```

Touch coordinates by device:

| Action | Stax (400x672) | Flex (480x600) |
|--------|----------------|----------------|
| Back | 36, 36 | 45, 45 |
| Confirm | 200, 606 | 240, 550 |
| Reject | 36, 606 | 55, 530 |
| Review Confirm | 200, 515 | 240, 435 |
| Review Reject | 36, 606 | 55, 530 |
| Home | 200, 606 | 240, 550 |

#### Screenshots

```bash
# Take a screenshot (returns PNG)
curl http://localhost:5001/screenshot > screenshot.png
```

#### Send Raw APDU

```bash
# Send APDU hex data
curl -X POST http://localhost:5001/apdu \
  -H 'Content-Type: application/json' \
  -d '{"data":"e006000000"}'
```

#### Get Screen Events

```bash
# Get current screen text/element positions
curl http://localhost:5001/events
```

#### Automation Rules

```bash
# Set automation rules for auto-accepting screens
curl -X POST http://localhost:5001/automation \
  -d '{"version":1,"rules":[{"text":"Accept","action":"press-and-release"}]}'

# Clear automation rules
curl -X POST http://localhost:5001/automation \
  -d '{"version":1,"rules":[]}'
```

### SpeculosClient (TypeScript)

For test scripts, use `SpeculosClient` from `test/e2e/speculos/client.ts`:

```typescript
import { SpeculosClient } from '../speculos';

const client = new SpeculosClient();
await client.connect();

// Button presses (Nano)
await client.pressButton('right');
await client.pressButton('left');
await client.pressButton('both');

// Touch events (Stax/Flex)
await client.fingerTap(200, 606, 0.1);
await client.fingerSwipe(200, 336, 190, 336, 0.3);

// Screenshots
const pngBuffer = await client.getScreenshot();
const filePath = await client.saveScreenshot('my-test');

// Raw APDU
const response = await client.sendAPDU('e006000000');

// App configuration
const config = await client.getAppConfiguration();
// => { major: 1, minor: 11, patch: 0, blindSigningEnabled: true }

// Screen events
const events = await client.getEvents();
// => [{ text: "Accept", x: 100, y: 200, w: 50, h: 30 }, ...]

await client.disconnect();
```

### DeviceInteraction (High-Level Actions)

For common Ledger operations, use `DeviceInteraction` from `test/e2e/speculos/device-interaction.ts`. It automatically selects the right interaction type (buttons vs touch) based on device model:

```typescript
import { startSharedSpeculos, stopSharedSpeculos } from '../speculos';

const ctx = await startSharedSpeculos();
const { interaction, client } = ctx;

// Approve an ETH transaction
await interaction.approveTransaction();

// Approve a signing request
await interaction.approveSigning();

// Reject a transaction
await interaction.rejectTransaction();

// Approve blind signing (ERC20/ERC721)
await interaction.approveBlindSigning();

// Enable blind signing in settings
await interaction.enableBlindSigning();

// Navigate back to main menu
await interaction.navigateToMainMenu();

await stopSharedSpeculos(ctx);
```

#### Button Sequences (Nano S+ / Nano X)

| Operation | Sequence |
|-----------|----------|
| Approve transaction | 6x `right` + `both` |
| Approve signing | 2x `right` + `both` |
| Approve blind signing | `both` + 4x `right` + `both` |
| Reject transaction | `right` + `both` |
| Enable blind signing | `both` + `right` + `both` + `both` + 6x `right` + `both` + `left` |

#### Touch Sequences (Stax / Flex)

| Operation | Sequence |
|-----------|----------|
| Approve transaction | 3x swipe left + hold confirm button |
| Approve signing | 2x swipe left + hold confirm button |
| Approve blind signing | Tap confirm + N swipes + hold confirm |
| Reject transaction | Tap reject button |
| Enable blind signing | Pre-enabled via NVRAM (no UI interaction needed) |

## Stax and Flex Specifics

Stax and Flex are NBGL (Next-Generation Browser-based Ledger) devices with large touchscreens. They behave differently from Nano devices in several important ways.

### Key Differences from Nano

| Aspect | Nano S+ / Nano X | Stax / Flex |
|--------|-------------------|-------------|
| Interaction | Physical buttons | Touchscreen (tap, swipe, hold) |
| Screen size | 128x64 | Stax: 400x672, Flex: 480x600 |
| Blind signing | Must enable via settings UI | Pre-enabled via NVRAM binary |
| Signing confirm | Press both buttons | Hold confirm button (3s) |
| Review flow | Scroll with right button | Swipe left through pages |

### Starting Stax

```bash
SPECULOS_DEVICE=stax SPECULOS_ELF_FILENAME=ethereum-stax.elf yarn speculos:up
```

Touch coordinates for Stax (400x672 screen):

| Action | Coordinates | Notes |
|--------|-------------|-------|
| Back button | 36, 36 | Top-left corner |
| Confirm (hold) | 200, 606 | Bottom-center, hold 3 seconds |
| Reject | 36, 606 | Bottom-left |
| Review Confirm | 200, 515 | Mid-screen confirm button |
| Review Reject | 36, 606 | Bottom-left |
| Home | 200, 606 | Bottom-center |

### Starting Flex

```bash
SPECULOS_DEVICE=flex SPECULOS_ELF_FILENAME=ethereum-flex.elf yarn speculos:up
```

Touch coordinates for Flex (480x600 screen):

| Action | Coordinates | Notes |
|--------|-------------|-------|
| Back button | 45, 45 | Top-left corner |
| Confirm (hold) | 240, 550 | Bottom-center, hold 3 seconds |
| Reject | 55, 530 | Bottom-left |
| Review Confirm | 240, 435 | Mid-screen confirm button |
| Review Reject | 55, 530 | Bottom-left |
| Home | 240, 550 | Bottom-center |

### Touch Interactions via curl

#### Tap (quick press)

```bash
# Stax: tap confirm
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":606,"delay":0.1}'

# Flex: tap confirm
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":240,"y":550,"delay":0.1}'
```

#### Hold (long press for signing confirmation)

The `delay` parameter controls hold duration in seconds. For signing, hold the confirm button for 3 seconds:

```bash
# Stax: hold confirm to sign (3 seconds)
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":515,"delay":3.0}'

# Flex: hold confirm to sign (3 seconds)
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":240,"y":435,"delay":3.0}'
```

#### Swipe (navigate review screens)

Swipe left to advance through transaction review pages. Coordinates go from center to slightly left:

```bash
# Stax: swipe left (center to left)
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":336,"x2":190,"y2":336,"delay":0.5}'

# Flex: swipe left (center to left)
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":240,"y":300,"x2":230,"y2":300,"delay":0.5}'
```

### Touch Interactions via TypeScript

#### Manual tap, swipe, and hold

```typescript
import { SpeculosClient } from '../../speculos';
import { DEVICE_MODELS } from '../../speculos';

// Stax
const client = new SpeculosClient();
await client.connect();

// Tap back
await client.fingerTap(36, 36, 0.1);

// Swipe left (navigate review screen)
await client.fingerSwipe(200, 336, 190, 336, 0.5);

// Hold confirm button to approve (3 seconds)
await client.fingerTap(200, 515, 3.0);

// Tap reject
await client.fingerTap(36, 606, 0.1);
```

#### Using TouchInteraction (recommended)

`TouchInteraction` is automatically selected by `createDeviceInteraction` when the device model is `stax` or `flex`. It handles coordinates and delays for you:

```typescript
import { startSharedSpeculos, stopSharedSpeculos } from '../../speculos';

const ctx = await startSharedSpeculos();
const { interaction, client, deviceModel } = ctx;

// deviceModel.id => 'stax' or 'flex'
// deviceModel.screenSize => { width: 400, height: 672 } (Stax)
//                         => { width: 480, height: 600 } (Flex)
```

### Complete Flow Examples (Stax / Flex)

#### Approve an ETH send transaction

```bash
# 1. Swipe through 3 review screens
for i in $(seq 1 3); do
  curl -s -X POST http://localhost:5001/finger \
    -H 'Content-Type: application/json' \
    -d '{"action":"press-and-release","x":200,"y":336,"x2":190,"y2":336,"delay":0.5}'
  sleep 0.8
done

# 2. Hold the confirm button for 3 seconds to sign
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":515,"delay":3.0}'
```

#### Approve an ERC20 blind signing transaction

Blind signing requires dismissing a warning, then reviewing data pages:

```bash
# 1. Dismiss "Blind signing ahead" warning by tapping confirm
curl -s -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":606,"delay":0.1}'
sleep 0.8

# 2. Swipe through 4 review screens (default scroll count)
for i in $(seq 1 4); do
  curl -s -X POST http://localhost:5001/finger \
    -H 'Content-Type: application/json' \
    -d '{"action":"press-and-release","x":200,"y":336,"x2":190,"y2":336,"delay":0.5}'
  sleep 0.3
done

# 3. Hold confirm to sign
curl -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":200,"y":515,"delay":3.0}'
```

For unknown contract methods (e.g., `increaseAllowance`), the Ledger shows more hex data pages. Use a higher scroll count:

```bash
# increaseAllowance requires 7 scroll pages instead of 4
```

In TypeScript:

```typescript
await interaction.approveBlindSigning(7); // 7 review pages for increaseAllowance
```

#### Reject a transaction

```bash
# Stax: tap reject
curl -s -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":36,"y":606,"delay":0.1}'

# Flex: tap reject
curl -s -X POST http://localhost:5001/finger \
  -H 'Content-Type: application/json' \
  -d '{"action":"press-and-release","x":55,"y":530,"delay":0.1}'
```

#### Take a screenshot and read screen events

```bash
# Save screenshot to inspect current screen state
curl http://localhost:5001/screenshot > stax-screen.png

# Get text elements and their positions (useful for finding tap targets)
curl http://localhost:5001/events | jq .
```

### Blind Signing on NBGL Devices

Stax and Flex **cannot toggle blind signing via the Speculos touch UI** because the NBGL settings toggle is unresponsive to touch events in emulation. Instead, blind signing is **pre-enabled via an NVRAM binary** loaded at container startup (`--load-nvram` flag in `docker-compose.yml`).

This means:
- `interaction.enableBlindSigning()` is a no-op for Stax/Flex (logs a message and returns immediately)
- Blind signing is always available when the container starts
- No manual UI navigation to Settings > Blind Signing is needed

### Full Test Setup with SharedContext

For a complete test environment with Docker, ApduBridge, and WebHID mock:

```typescript
import {
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../speculos';

let ctx;

before(async () => {
  ctx = await startSharedSpeculos();
  // ctx.client - SpeculosClient for device control
  // ctx.interaction - DeviceInteraction for high-level actions
  // ctx.apduBridge - ApduBridge (WebSocket → Speculos TCP)
  // ctx.deviceModel - Device model config (name, screen size, etc.)
});

after(async () => {
  if (ctx) {
    await stopSharedSpeculos(ctx);
  }
});
```

## Limitations

Speculos cannot be used with the MetaMask extension in a regular browser. The extension requires:

1. A **WebHID mock** injected into the page (done by the test runner)
2. An **ApduBridge** Node WebSocket server running
3. Chrome flags (`--enable-features=WebHID`, `--disable-features=WebHidBlocklist`)

These are only available through the E2E test infrastructure. Use `--leave-running` to interact with the browser after a test, or use a **real Ledger** device for manual testing without E2E.
