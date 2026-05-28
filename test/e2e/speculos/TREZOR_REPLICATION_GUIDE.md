# Replicating the Speculos (Ledger Emulator) Pattern for Trezor

This document provides a detailed, step-by-step guide for replicating the Ledger hardware wallet E2E emulation infrastructure for Trezor hardware wallets. It covers the full architecture, every file's role, the data flow, and what needs to change for Trezor.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How the Ledger System Works](#how-the-ledger-system-works)
3. [Component-by-Component Breakdown](#component-by-component-breakdown)
4. [Key Differences: Ledger vs Trezor](#key-differences-ledger-vs-trezor)
5. [Step-by-Step Trezor Implementation Plan](#step-by-step-trezor-implementation-plan)
6. [File Mapping: Ledger → Trezor](#file-mapping-ledger--trezor)
7. [Trezor Emulator Options](#trezor-emulator-options)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Current Ledger Speculos Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Chrome Extension Process                        │
│                                                                     │
│  ┌──────────────────┐    chrome.runtime.sendMessage                │
│  │ Service Worker    │    (LedgerAction: getPublicKey, etc.)        │
│  │ (Background)      │◄──────────────────────────────────────┐     │
│  │                    │                                        │     │
│  │ LedgerOffscreen    │    sendResponse({ payload })           │     │
│  │ Bridge             │──────────────────────────────────────┐│     │
│  └─────────┬──────────┘                                      ││     │
│            │                                                  ││     │
│            │ chrome.runtime.sendMessage                       ││     │
│            ▼                                                  ││     │
│  ┌──────────────────────────────────────────────────────┐     ││     │
│  │ Offscreen Document (offscreen.html)                   │     ││     │
│  │                                                        │     ││     │
│  │  ┌─────────────────────────────────────────────────┐ │     ││     │
│  │  │ LedgerOffscreenHandler (ledger.ts)               │ │     ││     │
│  │  │                                                   │ │     ││     │
│  │  │  @ledgerhq/hw-app-eth  ←→  @ledgerhq/hw-transport│ │     ││     │
│  │  │       (LedgerEth)        ←→  (TransportWebHID)   │ │     ││     │
│  │  └───────────────┬─────────────────────────────────┘ │     ││     │
│  │                   │                                     │     ││     │
│  │          navigator.hid.sendReport()                     │     ││     │
│  │                   │                                     │     ││     │
│  │  ┌────────────────▼──────────────────────────────┐    │     ││     │
│  │  │ WebHID Mock (speculos-webhid-mock.ts)          │    │     ││     │
│  │  │ OR pre-lockdown script (webhid-mock-script.ts) │    │     ││     │
│  │  │                                                  │    │     ││     │
│  │  │  Mock device: vendorId=0x2c97, productId=0x01  │    │     ││     │
│  │  │  WebSocket → ws://localhost:9876                │    │     ││     │
│  │  └────────────────┬─────────────────────────────────┘    │     ││     │
│  └────────────────────┼──────────────────────────────────────┘     ││     │
└───────────────────────┼────────────────────────────────────────────┘│
                        │ WebSocket (HID frames)                      │
                        ▼                                            │
┌───────────────────────────────────────────────────────┐            │
│ Node.js Test Runner (ApduBridge on port 9876)          │            │
│                                                         │            │
│  ┌──────────────────────────────────────────────────┐ │            │
│  │ ApduBridge (apdu-bridge.ts)                       │ │            │
│  │                                                    │ │            │
│  │  WebSocket ← HID frames from browser              │ │            │
│  │  ledger-hid-framing.ts: decode HID → raw APDU     │ │            │
│  │  ledger-hid-framing.ts: encode raw APDU → HID     │ │            │
│  │  TCP → 127.0.0.1:9998 → Speculos                  │ │            │
│  └──────────────┬────────────────────────────────────┘ │            │
│                  │ TCP (raw APDU: [4-byte len][data])   │            │
│                  ▼                                      │            │
│  ┌──────────────────────────────────────────────────┐ │            │
│  │ SpeculosClient (client.ts)                        │ │            │
│  │                                                    │ │            │
│  │  TCP socket to Speculos APDU port (9998)           │ │            │
│  │  REST API to Speculos API port (5001)              │ │            │
│  │  - pressButton('left'/'right'/'both')              │ │            │
│  │  - getScreenshot()                                 │ │            │
│  │  - enableBlindSigning()                            │ │            │
│  └──────────────┬────────────────────────────────────┘ │            │
└─────────────────┼───────────────────────────────────────┘            │
                  │                                                      │
                  ▼                                                      │
┌─────────────────────────────────────────────────────────┐            │
│ Docker Container: Speculos (Ledger Nano S Plus emulator) │            │
│                                                           │            │
│  Container port 9999 (APDU) ← host port 9998             │            │
│  Container port 5000 (API) ← host port 5001              │            │
│  ethereum.elf (Ledger Ethereum app binary)                │            │
│  Seed: "urban secret spare tunnel rubber rally..."        │            │
└───────────────────────────────────────────────────────────┘
```

### Trezor Target Architecture (Proposed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Chrome Extension Process                        │
│                                                                     │
│  ┌──────────────────┐    chrome.runtime.sendMessage                │
│  │ Service Worker    │    (TrezorAction: getPublicKey, etc.)        │
│  │ (Background)      │◄──────────────────────────────────────┐     │
│  │                    │                                        │     │
│  │ TrezorOffscreen   │    sendResponse({ payload })           │     │
│  │ Bridge             │──────────────────────────────────────┐│     │
│  └─────────┬──────────┘                                      ││     │
│            │                                                  ││     │
│            ▼                                                  ││     │
│  ┌──────────────────────────────────────────────────────┐     ││     │
│  │ Offscreen Document (offscreen.html)                   │     ││     │
│  │                                                        │     ││     │
│  │  ┌─────────────────────────────────────────────────┐ │     ││     │
│  │  │ Trezor Handler (trezor.ts)                       │ │     ││     │
│  │  │                                                   │ │     ││     │
│  │  │  @trezor/connect-web → TrezorConnect SDK          │ │     ││     │
│  │  │    ↕ (uses Trezor Bridge / WebUSB internally)     │ │     ││     │
│  │  └───────────────┬─────────────────────────────────┘ │     ││     │
│  │                   │                                     │     ││     │
│  │          Trezor Connect transport                      │     ││     │
│  │          (WebUSB or trezord bridge)                    │     ││     │
│  │                   │                                     │     ││     │
│  │  ┌────────────────▼──────────────────────────────┐    │     ││     │
│  │  │ Trezor Transport Mock                           │    │     ││     │
│  │  │                                                  │    │     ││     │
│  │  │  Mock the Trezor transport layer                │    │     ││     │
│  │  │  WebSocket or HTTP → emulator                   │    │     ││     │
│  │  └────────────────┬─────────────────────────────────┘    │     ││     │
│  └────────────────────┼──────────────────────────────────────┘     ││     │
└───────────────────────┼────────────────────────────────────────────┘│
                        │                                              │
                        ▼                                              │
┌───────────────────────────────────────────────────────┐              │
│ Trezor Emulator (trezor-user-env / trezorctl)          │              │
│                                                         │              │
│  Emulates Trezor T device firmware                      │              │
│  Provides UDP/HTTP bridge for communication             │              │
│  REST API for button presses, screenshots               │              │
└───────────────────────────────────────────────────────┘
```

---

## How the Ledger System Works

### Data Flow for a Single Operation (e.g., Get Public Key)

1. **Test calls `withSpeculosFixtures()`** — starts Docker, creates `ApduBridge` WebSocket server, patches HTML with WebHID mock.

2. **Test code clicks "Connect Ledger" in the MetaMask UI** — MetaMask's keyring calls `LedgerOffscreenBridge.getPublicKey()`.

3. **`LedgerOffscreenBridge` (service worker)** sends `chrome.runtime.sendMessage({ target: 'ledger-offscreen', action: LedgerAction.getPublicKey })`.

4. **`LedgerOffscreenHandler` (offscreen document, `ledger.ts`)** receives the message, calls `@ledgerhq/hw-app-eth.getAddress()`.

5. **`@ledgerhq/hw-transport-webhid`** encodes the APDU into Ledger HID frames (64-byte packets with channel/tag/sequence headers). Calls `device.sendReport(0, frameData)`.

6. **WebHID Mock** intercepts `sendReport()`. The mock was injected BEFORE LavaMoat lockdown so `navigator.hid` is the mock, not the real API. The mock sends the HID frame as a JSON WebSocket message `{ type: 'HID_SEND', id, data: [...] }` to `ws://localhost:9876`.

7. **`ApduBridge` (Node.js)** receives the WebSocket message. Uses `ledger-hid-framing.ts` (wrapping `@ledgerhq/devices/hid-framing`) to reassemble HID frames into a raw APDU buffer.

8. **`SpeculosClient`** sends the raw APDU to Speculos via TCP (`127.0.0.1:9998`). Wire format: `[4-byte BE length][apdu bytes]`.

9. **Speculos (Docker)** runs the Ethereum app (`ethereum.elf`) on emulated firmware, processes the APDU, returns response via TCP.

10. **Response path**: `SpeculosClient` → `ApduBridge` → HID-frame the response → WebSocket → WebHID Mock fires `inputreport` event → `TransportWebHID` decodes → `LedgerEth` returns result → offscreen handler → `sendResponse()` → service worker bridge → keyring.

### The Two WebHID Mock Injection Paths

The system has **two separate** WebHID mock implementations for different contexts:

#### Path A: Pre-lockdown HTML injection (for ALL extension pages)

**File:** `test/e2e/speculos/webhid-mock-script.ts` + `with-speculos-fixtures.ts:patchLockdownRunForSpeculos()`

This is the **primary** injection method. It:
1. Writes the mock script to `dist/chrome/scripts/speculos-webhid-mock.js`
2. Patches every `.html` file in `dist/chrome/` to load this script BEFORE `runtime-lavamoat.js`
3. Because it loads before LavaMoat's lockdown (which "scuttles" `navigator.hid`), the mock survives

This covers: popup, notification dialog, home page, sidepanel, and offscreen document.

#### Path B: Offscreen document built-in mock (for test builds)

**Files:** `app/offscreen/speculos-init.ts` + `app/offscreen/speculos-webhid-mock.ts`

This is the **secondary** injection for the offscreen document specifically:
1. Guarded by `process.env.IN_TEST` — only runs in test builds
2. Called from `app/offscreen/offscreen.ts` during initialization
3. Uses a saved reference to `WebSocket` (saved as `window.__speculosWS`) before LavaMoat can scuttle it
4. Installs the same mock `navigator.hid` with WebSocket connection to ApduBridge

### Why Two Paths?

LavaMoat's SES lockdown removes/restricts browser APIs like `navigator.hid` and `WebSocket`. The offscreen document is a separate extension page that runs its own LavaMoat lockdown. The pre-lockdown HTML injection handles most pages, but the offscreen document's mock also needs a "clean" WebSocket constructor reference (not the scuttled one).

---

## Component-by-Component Breakdown

### 1. Docker Layer

**File:** `test/e2e/speculos/docker-compose.yml`

```yaml
services:
  speculos:
    image: ghcr.io/ledgerhq/speculos:latest
    container_name: metamask-speculos
    ports:
      - '9998:9999'   # APDU (host:container)
      - '5001:5000'   # REST API (host:container)
    volumes:
      - ./apps:/speculos/apps:ro
    command: >
      --model nanosp /speculos/apps/ethereum.elf
      --seed "urban secret spare tunnel rubber rally..."
      --display headless
      --apdu-port 9999
      --api-port 5000
```

Key points:
- Uses a **deterministic seed** so derived addresses are always the same
- Mounts the `apps/ethereum.elf` binary (Ledger Ethereum app compiled for the emulator)
- Runs headless (no display needed)
- Healthcheck verifies REST API is responding
- Port mapping avoids conflicts with macOS system services (9999, 5000)

**Trezor equivalent:** Would use `trezor-user-env` Docker image or `trezorctl` with an emulator binary.

---

### 2. Constants

**File:** `test/e2e/speculos/constants.ts`

Defines:
- `DeviceConfig` — typed config for each device instance (id, container name, ports)
- `DEFAULT_DEVICE` — primary device ports (APDU: 9998, API: 5001, WS bridge: 9876)
- `DEVICE_PRESETS` — array of configs for multi-device tests
- `SPECULOS_LEDGER_ADDRESSES` — 5 pre-derived addresses from the seed
- `SPECULOS_E2E_PORTS` — all ports needing cleanup between runs

**Trezor equivalent:** Would define Trezor-specific ports, container names, and seed-derived addresses.

---

### 3. SpeculosClient (Device Communication)

**File:** `test/e2e/speculos/client.ts`

This is the low-level communication layer with the emulator:

- **TCP connection** (`net.Socket`) to Speculos APDU port for raw APDU exchange
- **REST API** (`fetch`) to Speculos API port for:
  - `pressButton('left'|'right'|'both')` — simulate button presses
  - `getScreenshot()` — capture device screen as PNG
  - `enableBlindSigning()` — navigate device menus to enable blind signing
- **APDU wire format:** `[4-byte BE length][apdu data]` for requests, `[4-byte BE length][payload][2-byte SW]` for responses
- **Mutex** on `exchange()` — serializes concurrent APDU exchanges
- **Reconnection** support with `connectWithResilience()`

**Trezor equivalent:** Would communicate with the Trezor emulator via its bridge protocol (HTTP or WebSocket), and use `trezorctl` or the emulator's API for button presses/screenshots.

---

### 4. Ledger HID Framing

**File:** `test/e2e/speculos/ledger-hid-framing.ts`

This is the **most Ledger-specific** component. It wraps `@ledgerhq/devices/lib/hid-framing` to:

- **Decode:** Reassemble multiple 64-byte HID frames into a single raw APDU
- **Encode:** Split a raw APDU response into multiple 64-byte HID frames

The Ledger HID protocol adds a header to each 64-byte USB HID report:
```
[channel: 2 bytes][tag: 1 byte][seq: 1 byte][payload: up to 59 bytes]
```

Functions:
- `createLedgerHidFramingSession(firstFrame)` — extracts channel ID from first frame, creates framing state
- `pushLedgerHidFrame(session, frame)` — accumulates frames, returns complete APDU when done
- `encodeLedgerHidResponse(session, apduResponse)` — encodes APDU response back into HID frames

**Trezor equivalent:** Trezor uses a completely different protocol. Trezor devices communicate via **Trezor Bridge** (a local HTTP daemon) or **WebUSB**. The protocol uses Protobuf messages, not raw APDUs. You would NOT need HID framing — instead you'd need to understand the Trezor wire protocol (see [Trezor Protocol](https://docs.trezor.io/trezor-firmware/core/message-workflows/)).

---

### 5. ApduBridge (WebSocket ↔ Emulator Relay)

**File:** `test/e2e/speculos/apdu-bridge.ts`

The central relay between the browser extension and the emulator:

- **WebSocket server** on port 9876 — accepts connections from the WebHID mock in the browser
- **Message types:**
  - `HID_SEND` — browser sends an HID frame; bridge decodes → APDU → forwards to Speculos
  - `HID_RECV` — bridge encodes Speculos response into HID frames → sends to browser
  - `HID_FRAME_ACK` — acknowledgment for multi-frame buffering
  - `HID_EXCHANGE_COMPLETE` — signals end of an exchange
  - `APDU_REQUEST`/`APDU_RESPONSE` — legacy raw APDU mode
  - `DEBUG` — debug messages from browser
- **Signing APDU detection** — emits `signing-apdu` event when INS=0x04/0x08/0x1a/0x20/0x22 detected
- **Error injection** — `injectNextErrorResponse(statusCode)` replaces next APDU response with a custom error
- **GET_APP_CONFIGURATION patching** — patches `arbitraryDataEnabled` from 0→1 in the response

**Trezor equivalent:** Instead of HID framing, would need to relay Trezor protocol messages (Protobuf over HTTP/WebSocket). The Trezor Connect SDK communicates with `trezord` (Trezor Bridge daemon) via HTTP on localhost.

---

### 6. WebHID Mock

**Files:**
- `test/e2e/speculos/webhid-mock-script.ts` — injected into all extension HTML pages before LavaMoat lockdown
- `app/offscreen/speculos-webhid-mock.ts` — installed in offscreen document at runtime

Both create a fake `navigator.hid` that:
- Returns a mock `HIDDevice` with `vendorId: 0x2c97`, `productId: 0x0001` (Ledger Nano S Plus)
- `sendReport()` sends HID frames via WebSocket to ApduBridge
- `addEventListener('inputreport', cb)` registers callbacks that fire when response frames arrive
- `getDevices()` / `requestDevice()` return the mock device
- Uses the real `WebSocket` constructor (saved before LavaMoat lockdown)

**Trezor equivalent:** Trezor does NOT use WebHID. Trezor Connect uses either:
1. **`trezord` bridge** — a native daemon running on localhost:21325 that handles USB communication
2. **WebUSB** — direct USB access from the browser

For emulation, you'd need to mock the Trezor transport at the `@trezor/connect-web` level, intercepting calls and routing them to the emulator.

---

### 7. Test Helper (Docker Lifecycle)

**File:** `test/e2e/speculos/test-helper.ts`

Manages the Docker container lifecycle:
- `start()` — checks ports, runs `docker-compose up -d`, waits for healthcheck
- `stop()` — disconnects client, runs `docker-compose down`
- `startWithRetry()` — retries startup with exponential backoff
- `ensureReady()` — waits for container health + connects TCP client
- Port conflict detection — checks if ports are in use by stale containers

---

### 8. Shared Context

**File:** `test/e2e/speculos/shared-context.ts`

Manages the singleton pattern for test suites:
- `startSharedSpeculos()` — starts container, creates ApduBridge, enables blind signing, registers SIGTERM/SIGINT handlers
- `stopSharedSpeculos()` — stops bridge and container, cleans up orphan processes
- Returns a `SharedSpeculosContext` object with `{ helper, client, apduBridge, wsBridgePort, device }`
- Used in test `before()`/`after()` hooks to share one emulator instance across multiple tests

---

### 9. withSpeculosFixtures (Test Integration)

**File:** `test/e2e/speculos/with-speculos-fixtures.ts`

The main entry point for tests. Wraps the standard `withFixtures()` E2E helper:

1. Validates test environment (`SPECULOS_E2E=1`)
2. Starts Speculos container (or reuses shared context)
3. Starts ApduBridge WebSocket server
4. **Patches all HTML files** in `dist/chrome/` to inject the WebHID mock before LavaMoat
5. Calls `withFixtures()` with additional speculos-specific ignored console errors
6. Passes `speculosClient`, `speculosHelper`, `apduBridge`, `wsBridgePort` to the test
7. Cleans up bridge + container in `finally` block

---

### 10. Resilience

**File:** `test/e2e/speculos/resilience.ts`

Generic retry utilities:
- `withRetry(fn, { maxRetries, shouldRetry, onRetry })` — retries with exponential backoff
- `ExponentialBackoff` — configurable backoff with multiplier and max
- `isRetryableError()` — checks for ECONNREFUSED, ETIMEDOUT, ECONNRESET, etc.

**Trezor equivalent:** Can be reused as-is; not Ledger-specific.

---

### 11. Cleanup

**File:** `test/e2e/speculos/cleanup.ts`

Ensures no orphan processes remain:
1. Kills processes on all E2E ports (8545, 8111, 8088, 8090, 9876, 9998, 5001)
2. Kills orphaned chromedriver and Chrome processes
3. Stops and removes Docker containers
4. Prunes stale Docker networks
5. Waits for OS to release sockets

**Trezor equivalent:** Can be reused with Trezor-specific ports added.

---

### 12. Build Config

**File:** `test/e2e/speculos/build-config.ts`

Chrome flags and environment validation:
- `getChromeFlags()` — returns `['--enable-features=WebHID', '--disable-features=WebHidBlocklist']`
- `validateSpeculosTestEnv()` — checks `SPECULOS_E2E=1` or `NODE_ENV=test`

**Trezor equivalent:** Trezor doesn't need WebHID flags but may need WebUSB flags or trezord bridge configuration.

---

## Key Differences: Ledger vs Trezor

| Aspect | Ledger | Trezor |
|--------|--------|--------|
| **Transport** | WebHID (navigator.hid) | trezord bridge (HTTP :21325) or WebUSB |
| **Protocol** | Raw APDU over HID frames | Protobuf messages over HTTP/WebSocket |
| **SDK** | `@ledgerhq/hw-app-eth` + `@ledgerhq/hw-transport-webhid` | `@trezor/connect-web` (TrezorConnect) |
| **Emulator** | [Speculos](https://github.com/LedgerHQ/speculos) | [trezor-user-env](https://github.com/trezor/trezor-user-env) |
| **App binary** | `ethereum.elf` (Ledger app binary) | Firmware binary (built into emulator) |
| **Button model** | Left / Right / Both | Button presses via emulator API |
| **Framing** | Custom HID framing (64-byte packets with channel/tag/seq) | No HID framing; Protobuf over HTTP |
| **Bridge in extension** | `LedgerOffscreenBridge` → `LedgerOffscreenHandler` | `TrezorOffscreenBridge` → `TrezorConnectSDK` in offscreen |
| **Communication path** | Offscreen → WebHID → (mock) → WebSocket → ApduBridge → TCP → Speculos | Offscreen → TrezorConnect → trezord → USB/emu |
| **Seed addresses** | 5 pre-derived addresses from known seed | Would need equivalent seed + derivation |
| **Blind signing** | Must be enabled via button sequence on device | Not applicable (Trezor has different signing model) |
| **Error codes** | APDU status words (0x6985, 0x6d00, 0x5515) | Trezor protocol error types |

---

## Step-by-Step Trezor Implementation Plan

### Phase 1: Trezor Emulator Setup

#### 1.1 Choose and Set Up the Emulator

The recommended approach is [trezor-user-env](https://github.com/trezor/trezor-user-env):

```yaml
# test/e2e/trezor/docker-compose.yml
version: '3.8'
services:
  trezor-emulator:
    image: ghcr.io/trezor/trezor-user-env:latest
    container_name: metamask-trezor
    ports:
      - '21324:21324'  # Trezor Bridge (HTTP)
      - '21325:21325'  # Trezor Bridge (WebSocket)
      - '9001:9001'    # Emulator control
    # Trezor-user-env starts both the emulator and the bridge daemon
```

Alternatively, use `trezorctl` from [python-trezor](https://github.com/trezor/python-trezor):
```bash
# Install trezorctl
pip install trezor

# Start emulator (requires building trezor-firmware)
trezorctl emu start
```

#### 1.2 Create the Trezor App Directory

```bash
mkdir -p test/e2e/trezor
```

No `.elf` binary needed — the Ethereum functionality is built into Trezor firmware.

---

### Phase 2: Constants and Configuration

Create `test/e2e/trezor/constants.ts`:

```typescript
export type TrezorDeviceConfig = {
  id: string;
  containerName: string;
  bridgePort: number;     // trezord HTTP port (default 21325)
  controlPort: number;    // emulator control API
  wsBridgePort: number;   // WebSocket bridge for mock transport
};

export const DEFAULT_TREZOR_DEVICE: TrezorDeviceConfig = {
  id: 'default',
  containerName: 'metamask-trezor',
  bridgePort: 21325,
  controlPort: 9001,
  wsBridgePort: 9874,     // different from Ledger's 9876
};

// Derive these from the emulator's seed
export const TREZOR_ADDRESSES = [
  // m/44'/60'/0'/0/0, m/44'/60'/0'/0/1, etc.
  // Will be populated after testing against the emulator
] as const;

export const TREZOR_ADDRESS = TREZOR_ADDRESSES[0];
```

---

### Phase 3: Trezor Client

Create `test/e2e/trezor/client.ts`:

```typescript
// Unlike Ledger's TCP+REST model, Trezor communicates via the
// trezord bridge HTTP API.

export class TrezorEmulatorClient {
  private bridgeUrl: string;
  private controlUrl: string;

  constructor(options: { bridgePort?: number; controlPort?: number }) {
    this.bridgeUrl = `http://127.0.0.1:${options.bridgePort ?? 21325}`;
    this.controlUrl = `http://127.0.0.1:${options.controlPort ?? 9001}`;
  }

  // Press buttons on the emulator
  async pressButton(button: 'left' | 'right' | 'both'): Promise<void> {
    // trezor-user-env API or trezorctl
  }

  // Take screenshot
  async getScreenshot(): Promise<Buffer> {
    // Emulator screenshot API
  }

  // Check if emulator is ready
  async isReady(): Promise<boolean> {
    // Health check
  }
}
```

---

### Phase 4: Trezor Bridge Relay

This is where the architecture differs most from Ledger. See [The Two Mocking Approaches (Deep Dive)](#the-two-mocking-approaches-deep-dive) for the full analysis.

**Recommended: Approach A2 — HTTP proxy through trezord-go**

Create `test/e2e/trezor/trezor-bridge-mock.ts`:

```typescript
import http from 'http';

/**
 * HTTP proxy that sits between @trezor/connect-web's BridgeTransport
 * and the real trezord-go bridge. Proxies all requests transparently
 * while emitting events for test assertions and error injection.
 *
 * See "Approach A: Mock the trezord Bridge" in TREZOR_REPLICATION_GUIDE.md
 */
export class TrezorBridgeMock {
  private server: http.Server | null = null;
  private emulatorClient: TrezorEmulatorClient;
  private realBridgeUrl: string;

  constructor(
    emulatorClient: TrezorEmulatorClient,
    private port: number,            // Port the mock listens on (e.g., 21326)
    realBridgePort = 21325,          // Port trezord-go listens on
  ) {
    this.emulatorClient = emulatorClient;
    this.realBridgeUrl = `http://127.0.0.1:${realBridgePort}`;
  }

  async start(): Promise<void> {
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${this.port}`);
      const body = await this.readBody(req);

      // Emit events for test assertions
      this.emit('request', { path: url.pathname, body });

      // Proxy to real trezord-go
      const realResponse = await fetch(`${this.realBridgeUrl}${url.pathname}`, {
        method: 'POST',
        body: body || undefined,
      });
      const realResponseBody = await realResponse.text();

      // Optionally modify response for error injection
      const finalResponse = this.modifyResponse(url.pathname, realResponseBody);

      res.writeHead(realResponse.status, { 'Content-Type': 'application/json' });
      res.end(finalResponse);
    });
    // ...
  }
}
```

The `@trezor/connect-web` SDK must be configured to point to this mock. In `trezor.ts`:

```typescript
// When IN_TEST, use a custom BridgeTransport pointing to the mock
if (process.env.IN_TEST) {
  const { BridgeTransport } = await import('@trezor/transport');
  initSettings.transports = [
    new BridgeTransport({ url: 'http://127.0.0.1:21326' })
  ];
}
```

---

### Phase 5: Offscreen Document Integration

The Trezor offscreen handler (`app/offscreen/hardware-wallets/trezor.ts`) uses `TrezorConnectSDK` directly. For emulation with Approach A (bridge mock):

#### Modify `trezor.ts` to accept custom transport (minimal change)

```typescript
// app/offscreen/hardware-wallets/trezor.ts
// In the TrezorAction.init case:

case TrezorAction.init:
  TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
    // ... existing device event handling ...
  });

  const initSettings = { ...msg.params, env: 'webextension' };

  // IN_TEST: route transport through the mock bridge proxy
  if (process.env.IN_TEST) {
    const mockPort = (window as any).__trezorMockBridgePort ?? 21326;
    initSettings.transports = [
      // BridgeTransport is imported from @trezor/transport
      // and configured to point to the mock instead of the default :21325
      { type: 'bridge', url: `http://127.0.0.1:${mockPort}` },
    ];
  }

  TrezorConnectSDK.init(initSettings).then(() => {
    sendResponse();
  });
  break;
```

Alternatively, for Approach B (SDK-level mock), you would instead inject a `window.__trezorMock` object and replace `TrezorConnectSDK` calls:

```typescript
const SDK = (window as any).__trezorMock ?? TrezorConnectSDK;
// Use SDK everywhere instead of TrezorConnectSDK
```

---

### Phase 6: Test Helper and Fixture Wrapper

Create `test/e2e/trezor/test-helper.ts`:

```typescript
export class TrezorTestHelper {
  // Similar to SpeculosTestHelper but for Trezor emulator
  // - start/stop Docker container
  // - wait for health
  // - get client
}
```

Create `test/e2e/trezor/with-trezor-fixtures.ts`:

```typescript
export async function withTrezorFixtures(
  options: WithTrezorFixturesOptions,
  testSuite: (args: TrezorFixturesTestSuiteArgs) => Promise<void>,
): Promise<void> {
  // 1. Validate environment
  // 2. Start Trezor emulator (Docker)
  // 3. Start bridge mock
  // 4. Patch extension for Trezor mock (if needed)
  // 5. Call withFixtures()
  // 6. Pass trezorClient, trezorHelper, bridgeMock to test
  // 7. Cleanup
}
```

---

### Phase 7: Test Files

Create test files mirroring the Ledger structure:

```
test/e2e/tests/hardware-wallets/trezor/
├── trezor-account.spec.ts      # Account connection/disconnection
├── trezor-send.spec.ts         # ETH send transactions
├── trezor-error.spec.ts        # Error handling
├── trezor-erc20.spec.ts        # ERC-20 token operations
├── trezor-erc721.spec.ts       # ERC-721 NFT operations
└── trezor-sign.spec.ts         # Message/signing tests
```

Example test structure:

```typescript
import { startSharedTrezor, stopSharedTrezor } from '../../../trezor/shared-context';
import { withTrezorFixtures } from '../../../trezor/with-trezor-fixtures';

describe('Trezor Hardware Account Management @trezor', function () {
  let shared: SharedTrezorContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedTrezor();
  });

  after(async function () {
    await stopSharedTrezor(shared);
  });

  it('connects and derives accounts', async function () {
    await withTrezorFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver, trezorClient }) => {
        // Navigate to connect hardware wallet
        // Select Trezor
        // Verify accounts match expected addresses
      },
    );
  });
});
```

---

### Phase 8: Signing Flow Automation

For Ledger, signing approval uses `ApduBridge.waitForSigningApduAndApprove()`:

```typescript
// Ledger pattern:
await apduBridge.waitForSigningApduAndApprove(speculosClient, 6);
```

For Trezor, create an equivalent:

```typescript
// trezor-bridge-mock.ts:
async waitForSigningRequestAndApprove(
  trezorClient: TrezorEmulatorClient,
): Promise<void> {
  // 1. Wait for a signing message to arrive at the mock bridge
  // 2. Press buttons on the emulator to confirm
  // 3. Return the signing response
}
```

Trezor button sequences differ from Ledger:
- Trezor T: Tap the screen at specific coordinates
- Trezor One: Press and hold both buttons to confirm

---

## File Mapping: Ledger → Trezor

| Ledger File | Purpose | Trezor Equivalent |
|------------|---------|-------------------|
| `docker-compose.yml` | Speculos container | `docker-compose.yml` (trezor-user-env) |
| `apps/ethereum.elf` | Ledger app binary | Not needed (in firmware) |
| `constants.ts` | Ports, addresses | `constants.ts` (Trezor ports, addresses) |
| `client.ts` | TCP + REST to Speculos | `client.ts` (HTTP to trezor-user-env) |
| `ledger-hid-framing.ts` | HID frame encode/decode | **Not needed** (Trezor uses HTTP/Protobuf) |
| `apdu-bridge.ts` | WebSocket ↔ Speculos relay | `trezor-bridge-mock.ts` (HTTP mock server) |
| `webhid-mock-script.ts` | Pre-lockdown WebHID mock | **Not needed** (Trezor doesn't use WebHID) |
| `speculos-webhid-mock.ts` | Offscreen WebHID mock | Trezor transport mock (if needed) |
| `speculos-init.ts` | Offscreen mock init | `trezor-emulator-init.ts` |
| `test-helper.ts` | Docker lifecycle | `test-helper.ts` (same pattern) |
| `shared-context.ts` | Singleton context | `shared-context.ts` (same pattern) |
| `with-speculos-fixtures.ts` | Test fixture wrapper | `with-trezor-fixtures.ts` |
| `build-config.ts` | Chrome flags, env validation | `build-config.ts` (may not need WebHID flags) |
| `resilience.ts` | Retry utilities | **Reuse as-is** |
| `cleanup.ts` | Process cleanup | **Reuse with Trezor ports** |
| `index.ts` | Public exports | `index.ts` |

---

## Trezor Emulator Options

### Option 1: trezor-user-env (Recommended for E2E)

- **Repo:** https://github.com/trezor/trezor-user-env
- **Docker image:** `ghcr.io/trezor/trezor-user-env`
- **Includes:** Emulator + trezord-go bridge + WebSocket controller API
- **Pros:** All-in-one, official, actively maintained, Docker-ready, has a WebSocket controller for programmatic control
- **Cons:** Large Docker image, may need specific firmware versions

**Ports:**

| Port | Service |
|------|---------|
| `9001` | WebSocket Controller (programmatic control of emulator/bridge) |
| `9002` | Dashboard (HTML UI) |
| `21325` | trezord-go Bridge (HTTP API — the same one `@trezor/connect-web` talks to) |
| `15900` | VNC (emulator display) |

The WebSocket controller at `ws://localhost:9001` accepts commands to start/stop the emulator, start/stop the bridge, and send debug commands (button presses, etc.) to the emulator. This is how Trezor's own Suite E2E tests control the environment.

### Option 2: trezor-firmware Emulator (Raw)

- **Docs:** https://docs.trezor.io/trezor-firmware/core/emulator/index.html
- **Repo:** https://github.com/trezor/trezor-firmware
- **Build:** `make build_unix` (requires scons, SDL2, protobuf, Rust nightly)
- **Run:** `./emu.py --mnemonic "your mnemonic words here"`
- **Bridge:** Start separately with `trezord-go -e 21324`

This is the raw emulator binary — a Unix executable that runs the Trezor firmware on your host machine. No Docker needed, but you must build from source and start `trezord-go` separately.

Key features useful for testing:
- `--mnemonic "words..."` — pre-seed with a deterministic mnemonic
- `--slip0014` — use the SLIP-14 "all all all" test seed
- `--temporary-profile` — clean state, erased on exit
- `--disable-animation` — faster screen rendering
- Debug port `21325` (debuglink protocol) for automated button presses
- Press `p` to screenshot (or use debuglink API)

**Recommendation:** Use `trezor-user-env` for CI and Docker workflows. Use the raw emulator for local development/debugging when you need faster iteration.

---

## The Two Mocking Approaches (Deep Dive)

This is the core architectural decision. There are two fundamentally different places to intercept the communication chain between MetaMask and the Trezor emulator.

### Communication Chain Recap

To understand where to mock, here is the full call chain from MetaMask to the Trezor device:

```
MetaMask UI (popup/notification)
  │
  │ User clicks "Connect Trezor"
  │
  ▼
Keyring Controller (service worker)
  │
  │ Calls TrezorOffscreenBridge.getPublicKey()
  │
  ▼
TrezorOffscreenBridge (service worker)
  │
  │ chrome.runtime.sendMessage({ target: 'trezor-offscreen', action: 'getPublicKey' })
  │
  ▼
Trezor Handler (offscreen document — trezor.ts)
  │
  │ TrezorConnectSDK.getPublicKey({ path: "m/44'/60'/0'/0", coin: 'eth' })
  │
  ▼
@trezor/connect-web SDK (offscreen document)
  │
  │ ┌─────────────────────────────────────────────────────────┐
  │ │ MODE A: iframe (default for webextension)                │
  │ │                                                           │
  │ │  TrezorConnectSDK.init() creates a hidden iframe from    │
  │ │  connect.trezor.io/9/iframe.html (or custom connectSrc) │
  │ │                                                           │
  │ │  API calls go via window.postMessage → iframe            │
  │ └─────────────────────────────────────────────────────────┘
  │
  │ ┌─────────────────────────────────────────────────────────┐
  │ │ MODE B: core-in-popup                                    │
  │ │                                                           │
  │ │  Opens a Chrome tab as popup, runs core there            │
  │ │  Communication via ServiceWorkerWindowChannel            │
  │ └─────────────────────────────────────────────────────────┘
  │
  ▼
Core (inside iframe or popup)
  │
  │ Creates TransportList with configured transports:
  │   Default: ['BridgeTransport', 'WebUsbTransport']
  │
  ▼
Transport Layer
  │
  │ ┌──────────────────────────────┐  ┌────────────────────────────┐
  │ │ BridgeTransport (tried 1st)  │  │ WebUsbTransport (fallback) │
  │ │                              │  │                            │
  │ │ HTTP POST to trezord-go      │  │ navigator.usb (WebUSB)     │
  │ │ http://127.0.0.1:21325       │  │ Direct USB communication  │
  │ └──────────────┬───────────────┘  └────────────────────────────┘
  │                │
  │                │  HTTP API:
  │                │  POST /enumerate          → list devices
  │                │  POST /listen             → long-poll changes
  │                │  POST /acquire/{path}     → claim device session
  │                │  POST /call/{session}     → send protobuf, get response
  │                │  POST /release/{session}  → release session
  │                │
  │                │  Wire format: hex-encoded protobuf with protocol header
  │                │  (6-byte header: [2B messageType BE][4B length BE][protobuf payload])
  │                │
  ▼                ▼
trezord-go (Bridge daemon) — http://127.0.0.1:21325
  │
  │ Native USB communication with Trezor device/emulator
  │
  ▼
Trezor Emulator (trezor-user-env) or Physical Device
```

The two interception points are:

- **Approach A: Mock the trezord bridge** — intercept at the HTTP layer
- **Approach B: Mock the TrezorConnect SDK** — intercept at the JavaScript API layer

---

### Approach A: Mock the trezord Bridge (HTTP Interception)

**Also called:** "Bridge relay" or "Transparent HTTP proxy"

#### How It Works

Instead of letting `@trezor/connect-web` talk to the real `trezord-go` at `http://127.0.0.1:21325`, you start a **mock HTTP server** on the same port (or configure a custom port) that:

1. Accepts the exact same HTTP API as `trezord-go`
2. Forwards device calls (`/call`, `/post`, `/read`) to the Trezor emulator
3. Handles `/enumerate` and `/listen` to report the emulator as a connected device
4. Manages sessions (`/acquire`, `/release`) as a simple state machine
5. Intercepts signing calls for test assertions and error injection

```
┌──────────────────────────────────────────────────────────┐
│ Offscreen Document (iframe or popup)                      │
│                                                           │
│  @trezor/connect-web Core                                 │
│    │                                                      │
│    │ BridgeTransport                                      │
│    │ HTTP POST to http://127.0.0.1:21325                  │
│    │   /enumerate, /acquire, /call, /release              │
│    │                                                      │
│    │  ┌────────────────────── NO CHANGE HERE ──────────┐ │
│    │  │  Production @trezor/connect-web code runs       │ │
│    │  │  untouched. Only the HTTP endpoint differs.     │ │
│    │  └────────────────────────────────────────────────┘ │
│    │                                                      │
└────┼──────────────────────────────────────────────────────┘
     │
     │ HTTP (hex-encoded protobuf messages)
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ Node.js Test Runner                                       │
│                                                           │
│  TrezorBridgeMock (HTTP server on :21325)                 │
│    │                                                      │
│    │ 1. /enumerate  → returns fake device descriptor     │
│    │ 2. /acquire    → creates session, returns session ID│
│    │ 3. /call       → parses protobuf, detects signing,  │
│    │                  forwards to emulator, returns resp  │
│    │ 4. /release    → destroys session                   │
│    │                                                      │
│    │ Test assertions:                                     │
│    │  - waitForSigningCall()  → detects EthereumSignTx   │
│    │  - injectError()         → returns custom error     │
│    │                                                      │
│    │ Protobuf encode/decode:                              │
│    │  - Uses @trezor/protobuf messages (already a dep)   │
│    │  - Protocol: 6-byte header [msgType:u16][len:u32]   │
│    │  - Body: hex-encoded over HTTP                       │
│    │                                                      │
│    │ Button automation:                                    │
│    │  - Via trezor-user-env WebSocket controller :9001    │
│    │  - Or via trezorctl debug commands                   │
│    │                                                      │
└────┼──────────────────────────────────────────────────────┘
     │
     │ Forwarded protobuf messages
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ trezor-user-env (Docker)                                  │
│                                                           │
│  Trezor Emulator  ←→  trezord-go (on internal :21325)    │
│  (firmware binary)     (bridge daemon)                    │
│                                                           │
│  WebSocket Controller :9001 (for button presses, etc.)   │
└──────────────────────────────────────────────────────────┘
```

Wait — there's a subtlety. If `trezor-user-env` already runs `trezord-go` internally on port 21325, the mock would **replace** trezord-go (or run on a different port). There are two sub-approaches:

#### Sub-approach A1: Replace trezord-go entirely (mock IS the bridge)

The mock HTTP server runs on port 21325. It does NOT use trezord-go at all. Instead, it communicates directly with the emulator via its debug link protocol (UDP port 21324 or the WebSocket controller on 9001).

```
@trezor/connect-web → HTTP :21325 → TrezorBridgeMock → emulator (UDP/debuglink)
```

**How to talk to the emulator without trezord-go:**

The emulator exposes a **debug link** protocol (UDP port 21324) that allows:
- Sending raw protobuf messages directly
- Pressing buttons (`DebugLinkDecision` message)
- Taking screenshots (`DebugLinkGetState` message)

This means the mock would need to:
1. Implement the debug link protocol (send/receive protobuf over UDP)
2. Handle the full message lifecycle (Initialize → GetAddress → etc.)
3. Manage device state internally

This is more work but gives complete control.

#### Sub-approach A2: Proxy through trezord-go (mock proxies to real bridge)

The mock runs on a custom port (e.g., 21326) and proxies to trezord-go on 21325. TrezorConnect is configured to use the custom port.

```
@trezor/connect-web → HTTP :21326 → TrezorBridgeMock → HTTP :21325 → trezord-go → emulator
```

This is simpler because trezord-go handles all the device communication. The mock just:
1. Intercepts HTTP requests
2. Logs/detects signing operations
3. Forwards to the real bridge
4. Optionally modifies responses (error injection)

The key advantage: you don't need to implement the protobuf message handling — trezord-go does it.

**How to configure the custom port:** Pass a custom `BridgeTransport` instance to `TrezorConnect.init()`:

```typescript
import { BridgeTransport } from '@trezor/transport';

const customTransport = new BridgeTransport({
  url: 'http://127.0.0.1:21326',  // Point to mock instead of default 21325
});

TrezorConnectSDK.init({
  transports: [customTransport],
  manifest: { appName: 'MetaMask', appVersion: '1.0.0' },
  env: 'webextension',
});
```

#### How to Configure TrezorConnect for the Mock (Both Sub-approaches)

In the offscreen document, `trezor.ts` calls `TrezorConnectSDK.init()`. For tests, you need to inject a custom `transports` option. There are two ways:

**Method 1: Patch `trezor.ts` with an env check (minimal code change):**

```typescript
// app/offscreen/hardware-wallets/trezor.ts
case TrezorAction.init:
  const initSettings = { ...msg.params, env: 'webextension' };

  // IN_TEST: point transport to the mock bridge
  if (process.env.IN_TEST) {
    const { BridgeTransport } = await import('@trezor/transport');
    const mockTransport = new BridgeTransport({
      url: `http://127.0.0.1:${window.__trezorMockPort ?? 21326}`,
    });
    initSettings.transports = [mockTransport];
  }

  TrezorConnectSDK.init(initSettings).then(() => { sendResponse(); });
  break;
```

**Method 2: Override via `trezor-emulator-init.ts` (no production code change):**

Create `app/offscreen/trezor-emulator-init.ts` that patches `TrezorConnectSDK` or the `BridgeTransport` constructor before `trezor.ts` calls `init()`. This is analogous to how `speculos-init.ts` patches `navigator.hid` before Ledger code runs.

However, since `trezor.ts` imports `TrezzorConnectSDK` at the module level, this is harder to intercept without modifying the import. Method 1 is more practical.

#### What the Mock HTTP Server Looks Like

```typescript
// test/e2e/trezor/trezor-bridge-mock.ts
import http from 'http';
import { EventEmitter } from 'events';

export class TrezorBridgeMock extends EventEmitter {
  private server: http.Server | null = null;
  private sessions = new Map<string, { path: string; owner: string }>();
  private deviceSession: string | null = null;

  // For sub-approach A2: proxy to real trezord-go
  private proxyUrl: string | null;

  constructor(private port: number, options?: { proxyTo?: string }) {
    super();
    this.proxyUrl = options?.proxyTo ?? null;
  }

  async start(): Promise<void> {
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${this.port}`);
      const path = url.pathname;

      // Read request body
      const body = await this.readBody(req);

      try {
        if (path === '/') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            version: '3.0.0',
            configured: true,
            protocolMessages: false,
          }));
          return;
        }

        if (path === '/enumerate') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([
            {
              path: '1',
              session: this.deviceSession,
              sessionOwner: null,
              product: 'Trezor Model T',
              type: 'emulator',
              vendor: 'trezor.io',
              debug: true,
              debugSession: null,
            },
          ]));
          return;
        }

        if (path === '/listen') {
          // Long-poll: return immediately for simplicity in tests,
          // or implement real long-polling
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([
            { path: '1', session: null, product: 'Trezor Model T', /* ... */ },
          ]));
          return;
        }

        if (path.startsWith('/acquire/')) {
          const [, , devicePath, previousSession] = path.split('/');
          const sessionId = `session-${Date.now()}`;
          this.sessions.set(sessionId, { path: devicePath, owner: body });
          this.deviceSession = sessionId;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ session: sessionId }));
          return;
        }

        if (path.startsWith('/call/')) {
          const sessionId = path.split('/')[2];

          // Decode protobuf message to detect signing operations
          const msgType = this.parseMessageType(body);
          this.emit('call', { sessionId, msgType, body });

          // Detect signing operations for test assertions
          if (this.isSigningMessageType(msgType)) {
            this.emit('signing-call', { msgType, body });
          }

          if (this.proxyUrl) {
            // Sub-approach A2: proxy to real trezord-go
            const response = await this.proxyCall(sessionId, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: response }));
          } else {
            // Sub-approach A1: communicate with emulator directly
            // (would need debuglink implementation)
            const response = await this.sendToEmulator(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: response }));
          }
          return;
        }

        if (path.startsWith('/release/')) {
          const sessionId = path.split('/')[2];
          this.sessions.delete(sessionId);
          if (this.deviceSession === sessionId) {
            this.deviceSession = null;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{}');
          return;
        }

        res.writeHead(404);
        res.end('Not found');
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: (error as Error).message }));
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.port, () => resolve());
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server?.close(() => resolve());
    });
  }

  // Trezor protobuf message types for Ethereum
  // (from @trezor/protobuf or @trezor/connect)
  private isSigningMessageType(msgType: number): boolean {
    // These are the protobuf message type IDs for signing operations
    // EthereumSignTx = 58, EthereumSignMessage = 60,
    // EthereumSignTypedData = 495
    return [58, 60, 495].includes(msgType);
  }

  private parseMessageType(hexBody: string): number {
    // Protocol header: [2-byte messageType BE][4-byte length BE][payload]
    const buf = Buffer.from(hexBody, 'hex');
    if (buf.length < 6) return -1;
    return buf.readUInt16BE(0);
  }

  waitForSigningCall(timeout = 30000): Promise<{ msgType: number; body: string }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('signing-call', handler);
        reject(new Error('Timeout waiting for signing call'));
      }, timeout);
      const handler = (data: { msgType: number; body: string }) => {
        clearTimeout(timer);
        resolve(data);
      };
      this.once('signing-call', handler);
    });
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => resolve(data));
    });
  }

  // ... proxyCall() and sendToEmulator() implementations
}
```

#### Advantages of Approach A

1. **Minimal production code changes** — only need to add a `process.env.IN_TEST` check in `trezor.ts` to use a custom bridge URL
2. **Real TrezorConnect code runs** — the entire SDK, iframe/popup handling, protobuf encoding/decoding is production code, tested exactly as users experience it
3. **Analogous to Ledger's ApduBridge** — same architectural pattern (transparent relay between browser and emulator)
4. **Error injection** — can intercept `/call` responses and inject errors
5. **Signing detection** — can observe and assert on protobuf message types
6. **Sub-approach A2 is simple** — just an HTTP proxy with logging/assertion hooks

#### Disadvantages of Approach A

1. **Requires trezord-go running** (sub-approach A2) or debuglink implementation (sub-approach A1)
2. **iframe complexity** — in the default webextension mode, TrezorConnect runs inside an iframe loaded from `connect.trezor.io`. The iframe's `BridgeTransport` must point to the mock, which means configuring the transport before the iframe loads
3. **Protobuf message types** — need to know the numeric message type IDs to detect signing operations (though `@trezor/protobuf` is already a dependency)
4. **Session management** — the mock must implement the acquire/release session lifecycle correctly

---

### Approach B: Mock TrezorConnect at the SDK Level (JavaScript Interception)

**Also called:** "SDK mock" or "Offscreen handler mock"

#### How It Works

Instead of intercepting HTTP calls, you **replace the TrezorConnect SDK methods** in the offscreen document so that calls like `TrezorConnectSDK.getPublicKey()` go to your mock implementation instead of the real SDK.

The mock implementation communicates with the Trezor emulator directly (via its debug link or WebSocket controller), bypassing the entire iframe/transport/bridge chain.

```
┌──────────────────────────────────────────────────────────┐
│ Offscreen Document                                        │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │ TrezorConnectMock (injected BEFORE trezor.ts)     │    │
│  │                                                    │    │
│  │  getPublicKey({ path })  ─────────────────────┐   │    │
│  │  ethereumSignTransaction(params) ──────────┐  │   │    │
│  │  ethereumSignMessage(params) ───────────┐  │   │    │
│  │  init(settings) ────────────────────┐  │   │    │
│  │                                      │  │   │    │
│  │  REPLACES the real TrezorConnectSDK  │  │   │    │
│  │  with a mock that routes to the      │  │   │    │
│  │  emulator via WebSocket              │  │   │    │
│  └──────────────────────────────────────┼──┼──┼────┘    │
│                                          │  │  │         │
│  ┌──────────────────────────────────────┼──┼──┼────┐    │
│  │ trezor.ts (UNMODIFIED production code)│  │  │    │    │
│  │                                       │  │  │    │    │
│  │  TrezorConnectSDK.getPublicKey()  ────┘  │  │    │    │
│  │  TrezorConnectSDK.ethereumSign...()  ────┘  │    │    │
│  │  ...                                         │    │    │
│  └──────────────────────────────────────────────┘    │    │
│                                                       │    │
│  ┌──────────────────────────────────────────────┐    │    │
│  │ WebSocket → ws://localhost:9874                │    │    │
│  │ (or HTTP → emulator controller)               │    │    │
│  └──────────────────────────────────────────────┘    │    │
└───────────────────────────────────────────────────────┘    │
                       │                                      │
                       │ WebSocket                             │
                       ▼                                      │
┌──────────────────────────────────────────────────────────┐
│ Node.js Test Runner                                       │
│                                                           │
│  TrezorSDKRelay (WebSocket server on :9874)               │
│    │                                                      │
│    │ Receives SDK-level calls:                             │
│    │  { method: 'getPublicKey', params: {...} }           │
│    │                                                      │
│    │ Forwards to emulator via:                             │
│    │  - trezor-user-env WebSocket controller (:9001)      │
│    │  - Or trezorctl commands                             │
│    │  - Or raw debuglink protocol                         │
│    │                                                      │
│    │ Test assertions:                                     │
│    │  - waitForSigningRequest()                           │
│    │  - approveOnDevice() / rejectOnDevice()              │
│    │                                                      │
└───────────────────────────────────────────────────────────┘
```

#### How to Inject the Mock

The mock must be installed **before** `trezor.ts` imports and calls `TrezorConnectSDK`. There are two injection strategies:

**Strategy B1: Pre-lockdown script injection (same as Ledger's WebHID mock)**

Write a script to `dist/chrome/scripts/trezor-mock.js` and inject it into every HTML page BEFORE `runtime-lavamoat.js`, exactly like `patchLockdownRunForSpeculos()` does for Ledger:

```typescript
// In with-trezor-fixtures.ts (analogous to patchLockdownRunForSpeculos)
function patchLockdownForTrezor(wsPort: number): void {
  const mockScript = getTrezorMockScript(wsPort);

  // Write mock script to dist
  const scriptPath = path.join('dist', 'chrome', 'scripts', 'trezor-mock.js');
  fs.writeFileSync(scriptPath, mockScript);

  // Inject into ALL HTML files before runtime-lavamoat.js
  const distDir = path.join('dist', 'chrome');
  const htmlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf-8');

    if (html.includes('trezor-mock.js') || !html.includes('runtime-lavamoat.js')) continue;

    html = html.replace(
      '<script src="./scripts/runtime-lavamoat.js"',
      '<script src="./scripts/trezor-mock.js"></script>\n    <script src="./scripts/runtime-lavamoat.js"',
    );

    fs.writeFileSync(htmlPath, html);
  }
}
```

The mock script itself would patch `@trezor/connect-web`:

```typescript
// test/e2e/trezor/trezor-mock-script.ts
export function getTrezorMockScript(wsPort: number): string {
  return `
    (function() {
      if (window.__trezorMockInjected) return;
      window.__trezorMockInjected = true;

      const wsPort = ${wsPort};
      let ws = null;
      let msgId = 0;
      const pendingCalls = new Map();

      const connectWebSocket = function() {
        ws = new WebSocket('ws://localhost:' + wsPort);
        ws.onmessage = function(event) {
          const response = JSON.parse(event.data);
          const pending = pendingCalls.get(response.id);
          if (pending) {
            pendingCalls.delete(response.id);
            if (response.error) {
              pending.reject(new Error(response.error));
            } else {
              pending.resolve(response.payload);
            }
          }
        };
      };

      const callMock = function(method, params) {
        return new Promise(function(resolve, reject) {
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
          const id = ++msgId;
          pendingCalls.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      };

      // Store reference to the real SDK before it's imported
      // The offscreen document imports TrezorConnectSDK at module level
      // We need to intercept at a level that trezor.ts can use

      // Option: Override window.__trezorMock that trezor.ts checks for
      window.__trezorMock = {
        getPublicKey: function(params) {
          return callMock('getPublicKey', params);
        },
        ethereumSignTransaction: function(params) {
          return callMock('ethereumSignTransaction', params);
        },
        ethereumSignMessage: function(params) {
          return callMock('ethereumSignMessage', params);
        },
        ethereumSignTypedData: function(params) {
          return callMock('ethereumSignTypedData', params);
        },
        getFeatures: function() {
          return callMock('getFeatures', {});
        },
        init: function(params) {
          return callMock('init', params);
        },
        dispose: function() {
          return callMock('dispose', {});
        },
        on: function(event, callback) {
          // Listen for device events via WebSocket
          // ...
        },
      };

      connectWebSocket();
    })();
  `;
}
```

Then modify `trezor.ts` to check for the mock:

```typescript
// app/offscreen/hardware-wallets/trezor.ts (minimal production code change)
const SDK = (window as any).__trezorMock ?? TrezorConnectSDK;

// Use SDK everywhere instead of TrezorConnectSDK directly:
// SDK.init(...)
// SDK.getPublicKey(...)
// SDK.ethereumSignTransaction(...)
```

**Strategy B2: Offscreen document init-time injection (same as Ledger's speculos-init.ts)**

Create `app/offscreen/trezor-emulator-init.ts`:

```typescript
export async function initTrezorMockForEmulator(): Promise<void> {
  if (!process.env.IN_TEST) return;

  // Similar to speculos-init.ts:
  // 1. Save a clean WebSocket reference before LavaMoat scuttles it
  // 2. Create mock SDK that uses WebSocket to communicate with test runner
  // 3. Set window.__trezorMock for trezor.ts to pick up
}
```

Call it from `app/offscreen/offscreen.ts`:

```typescript
async function init(): Promise<void> {
  if (process.env.IN_TEST) {
    await initWebHIDMockForSpeculos();    // Ledger
    await initTrezorMockForEmulator();     // Trezor (new)
  }
  // ...
}
```

#### What the Node.js Relay Looks Like

```typescript
// test/e2e/trezor/trezor-sdk-relay.ts
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import net from 'net';

export class TrezorSDKRelay extends EventEmitter {
  private wss: WebSocketServer | null = null;

  async start(port: number): Promise<void> {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      ws.on('message', async (data) => {
        const msg = JSON.parse(data.toString());
        const { id, method, params } = msg;

        try {
          let result;

          switch (method) {
            case 'init':
              // Acknowledge init without actually calling TrezorConnect
              result = { success: true };
              break;

            case 'getPublicKey':
              // Communicate with emulator to get public key
              result = await this.emulatorGetPublicKey(params);
              break;

            case 'ethereumSignTransaction':
              this.emit('signing-request', { method, params });
              result = await this.emulatorSignTransaction(params);
              break;

            case 'getFeatures':
              result = await this.emulatorGetFeatures();
              break;

            default:
              result = { success: false, error: `Unknown method: ${method}` };
          }

          ws.send(JSON.stringify({ id, payload: result }));
        } catch (error) {
          ws.send(JSON.stringify({
            id,
            error: (error as Error).message,
          }));
        }
      });
    });
  }

  // These methods talk to the emulator directly via debuglink
  // or via the trezor-user-env WebSocket controller
  private async emulatorGetPublicKey(params: any): Promise<any> {
    // Send GetPublicKey protobuf message to emulator via debuglink
    // Parse response and return
  }

  private async emulatorSignTransaction(params: any): Promise<any> {
    // Send EthereumSignTx protobuf message to emulator
    // Automatically press confirm buttons
    // Parse signed response
  }

  waitForSigningRequest(timeout = 30000): Promise<{ method: string; params: any }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('signing-request', handler);
        reject(new Error('Timeout waiting for signing request'));
      }, timeout);
      const handler = (data: { method: string; params: any }) => {
        clearTimeout(timer);
        resolve(data);
      };
      this.once('signing-request', handler);
    });
  }

  async stop(): Promise<void> {
    this.wss?.close();
  }
}
```

#### Advantages of Approach B

1. **Complete control** — you intercept at the highest level (SDK methods), so you control exactly what each method returns
2. **No iframe complexity** — the mock replaces `TrezorConnectSDK` before the iframe is even created, so you bypass the entire iframe/postMessage/popup chain
3. **No protobuf handling** — you deal with clean JavaScript objects (params and responses), not hex-encoded protobuf
4. **Error injection is trivial** — just return `{ success: false, payload: { error: 'Device disconnected' } }` from any method
5. **Analogous to Ledger's offscreen mock** — similar injection pattern (pre-lockdown script or init-time patch)
6. **Works with any emulator** — since you control the full stack, you can use trezor-user-env, raw emulator, or even a completely fake device

#### Disadvantages of Approach B

1. **Does NOT test the real TrezorConnect code** — you bypass the entire SDK (iframe, transport, protobuf, session management). Bugs in the real integration won't be caught
2. **Must maintain SDK API compatibility** — your mock must exactly match the response shapes that `@trezor/connect-web` returns, or the keyring will break. This means tracking SDK version changes
3. **More production code changes** — need to modify `trezor.ts` to check for `window.__trezorMock`
4. **Must implement protobuf ↔ emulator communication** — the relay needs to speak the emulator's debuglink protocol to actually get signing results, which means dealing with protobuf after all (just in Node.js instead of the browser)

---

### Side-by-Side Comparison

| Aspect | A: Bridge HTTP Mock | B: SDK-Level Mock |
|--------|--------------------|--------------------|
| **What's mocked** | trezord-go HTTP API (port 21325) | TrezorConnect SDK methods |
| **What runs as production code** | Entire TrezorConnect SDK + iframe + transport | Only the offscreen bridge message handler |
| **Protobuf handling** | Mock sees hex-encoded protobuf on HTTP | Mock sees clean JS objects via WebSocket |
| **Injection point** | `trezor.ts` init params (custom `transports`) | Pre-lockdown script or `window.__trezorMock` |
| **Production code changes** | 1 line (`if (IN_TEST) use custom transport`) | ~5 lines (`const SDK = window.__trezorMock ?? TrezorConnectSDK`) |
| **iframe handling** | Must configure transport in iframe context | Bypassed entirely |
| **Error injection** | Intercept HTTP response, modify hex protobuf | Return mock JS error object |
| **Signing detection** | Parse protobuf message type from hex header | Method name string matching |
| **Session management** | Must implement acquire/release | Not needed |
| **Maintainability risk** | Low (HTTP API is stable) | Medium (must track SDK response shape changes) |
| **Test fidelity** | High (real SDK code runs) | Medium (mock may diverge from real behavior) |
| **Complexity** | Medium (HTTP proxy + protobuf parsing) | Low-Medium (WebSocket + method dispatch) |
| **Closest Ledger analog** | ApduBridge (transparent relay) | speculos-webhid-mock (API replacement) |

---

### Recommendation

**Start with Approach A2 (HTTP proxy through trezord-go)** for these reasons:

1. **Highest test fidelity** — real TrezorConnect code runs end-to-end, catching integration bugs
2. **Smallest production code changes** — only inject a custom `BridgeTransport` with different URL
3. **trezor-user-env already provides trezord-go** — it's already in the Docker container
4. **Same pattern as Ledger's ApduBridge** — team is familiar with the relay pattern
5. **HTTP API is simple and stable** — just proxy POST requests with hex strings

If you later find the HTTP proxy approach limiting (e.g., need to inject complex errors that are hard to express at the protobuf level, or need to bypass the iframe entirely), you can layer Approach B on top.

**Practical starting point:**

```
trezor-user-env Docker container
  ├── Emulator (firmware binary)
  ├── trezord-go bridge on :21325
  └── WebSocket controller on :9001

TrezorBridgeMock (Node.js HTTP server on :21326)
  ├── Proxies /call, /post, /read → trezord-go :21325
  ├── Logs all requests for test assertions
  ├── Emits events on signing calls
  ├── Can modify responses for error injection
  └── Uses controller :9001 for button automation

MetaMask extension (test build)
  └── trezor.ts configured with BridgeTransport({ url: ':21326' })
```

---

## Testing Strategy

### Running Trezor Tests (Proposed)

```bash
# Build test build
yarn build:test

# Run single test
TREZOR_E2E=1 yarn test:e2e:single test/e2e/tests/hardware-wallets/trezor/trezor-account.spec.ts --browser=chrome

# Run all Trezor tests
TREZOR_E2E=1 yarn test:e2e:single \
  "test/e2e/tests/hardware-wallets/trezor/trezor-account.spec.ts" \
  "test/e2e/tests/hardware-wallets/trezor/trezor-send.spec.ts" \
  --browser=chrome
```

### Environment Variables (Proposed)

| Variable | Purpose |
|----------|---------|
| `TREZOR_E2E=1` | Enable Trezor emulator test mode |
| `TREZOR_SKIP_DOCKER_START=1` | Use existing container (CI) |
| `TREZOR_HOST` | Override host (default `127.0.0.1`) |
| `TREZOR_BRIDGE_PORT` | Override trezord port (default `21325`) |

### CI Integration

Add a GitHub workflow (`.github/workflows/e2e-trezor.yml`) similar to the existing `e2e-speculos.yml`:
1. Start trezor-user-env as a Docker service
2. Set `TREZOR_SKIP_DOCKER_START=1`
3. Run tests with `TREZOR_E2E=1`

---

## Summary: What to Build

1. **Docker setup** — `test/e2e/trezor/docker-compose.yml` with trezor-user-env
2. **Constants** — `test/e2e/trezor/constants.ts` with ports and seed-derived addresses
3. **Client** — `test/e2e/trezor/client.ts` for emulator HTTP API communication
4. **Bridge mock** — `test/e2e/trezor/trezor-bridge-mock.ts` to intercept `@trezor/connect-web` calls
5. **Offscreen init** — `app/offscreen/trezor-emulator-init.ts` to configure TrezorConnect for emulator
6. **Test helper** — `test/e2e/trezor/test-helper.ts` for Docker lifecycle
7. **Shared context** — `test/e2e/trezor/shared-context.ts` for singleton pattern
8. **Fixtures** — `test/e2e/trezor/with-trezor-fixtures.ts` wrapping `withFixtures()`
9. **Test files** — `test/e2e/tests/hardware-wallets/trezor/*.spec.ts`
10. **CI workflow** — `.github/workflows/e2e-trezor.yml`

The **biggest architectural decision** is whether to mock at the trezord HTTP bridge level (simpler, closer to real usage) or at the TrezorConnect SDK level (more control, bypasses more layers). The trezord mock approach is recommended because it mirrors how Ledger's ApduBridge works as a transparent relay.
