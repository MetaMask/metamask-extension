# Speculos E2E Flow - Complete Architecture

## Overview

This document explains the complete end-to-end flow of how MetaMask E2E tests integrate with Speculos (Ledger's hardware wallet emulator) to test real Ledger device interactions without physical hardware.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              E2E TEST RUNNER (Node.js)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         SpeculosTestHelper                                      │    │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐   │    │
│  │  │  Docker Compose  │───▶│  Wait for Ready  │───▶│  SpeculosClient Connect │   │    │
│  │  │  (speculos:up)   │    │  (healthcheck)   │    │  (TCP :9999)            │   │    │
│  │  └──────────────────┘    └──────────────────┘    └─────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ 1. Container Started
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SPECULOS DOCKER CONTAINER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                    ghcr.io/ledgerhq/speculos:latest                             │    │
│  │                                                                                 │    │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │    │
│  │   │  TCP Server  │    │  REST API    │    │  Emulator    │                     │    │
│  │   │  Port 9999   │    │  Port 5000   │    │  (QEMU)      │                     │    │
│  │   │  (APDU)      │    │  /apdu       │    │              │                     │    │
│  │   │  /button     │    │  /button     │    │  ┌────────┐  │                     │    │
│  │   └──────────────┘    └──────────────┘    │  │Ethereum│  │                     │    │
│  │                                           │  │  App   │  │                     │    │
│  │   APDU Flow:                              │  │  .elf  │  │                     │    │
│  │   ┌─────────┐    ┌─────────┐    ┌────┐   │  └────────┘  │                     │    │
│  │   │  Test   │───▶│ TCP Sock│───▶│App │   │              │                     │    │
│  │   │ Client  │◀───│ :9999   │◀───│    │   │              │                     │    │
│  │   └─────────┘    └─────────┘    └────┘   │              │                     │    │
│  │                                           │              │                     │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ 2. TCP Connection
                                         │    (Socket:9999)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER (Playwright/Selenium)                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         WebHIDSpeculosBridge                                    │    │
│  │                                                                                 │    │
│  │   Step 1: Inject Mock WebHID                                                    │    │
│  │   ┌──────────────────────────────────────────────────────────────────────┐      │    │
│  │   │  driver.executeScript()                                               │      │    │
│  │   │                                                                         │      │    │
│  │   │  // Replace navigator.hid with mock                                   │      │    │
│  │   │  navigator.hid = {                                                    │      │    │
│  │   │    getDevices: () => [mockDevice],                                    │      │    │
│  │   │    requestDevice: () => [mockDevice],                                 │      │    │
│  │   │    addEventListener: () => {},                                        │      │    │
│  │   │    removeEventListener: () => {}                                      │      │    │
│  │   │  };                                                                   │      │    │
│  │   └──────────────────────────────────────────────────────────────────────┘      │    │
│  │                                                                                 │    │
│  │   Step 2: Create Mock HIDDevice                                                 │    │
│  │   ┌──────────────────────────────────────────────────────────────────────┐      │    │
│  │   │  window.__speculosDevice = {                                          │      │    │
│  │   │    vendorId: 0x2c97,        // Ledger                                 │      │    │
│  │   │    productId: 0x0001,                                                 │      │    │
│  │   │    productName: 'Ledger Nano S Plus',                                 │      │    │
│  │   │    opened: false,                                                     │      │    │
│  │   │                                                                         │      │    │
│  │   │    async open() { ... },                                              │      │    │
│  │   │    async close() { ... },                                             │      │    │
│  │   │                                                                         │      │    │
│  │   │    async sendReport(reportId, data) {                                 │      │    │
│  │   │      // Sends APDU to test runner via postMessage                     │      │    │
│  │   │      window.parent.postMessage({                                      │      │    │
│  │   │        type: 'SPECULOS_APDU',                                         │      │    │
│  │   │        reportId,                                                      │      │    │
│  │   │        data: Array.from(new Uint8Array(data))                         │      │    │
│  │   │      }, '*');                                                         │      │    │
│  │   │    },                                                                 │      │    │
│  │   │                                                                         │      │    │
│  │   │    addEventListener(type, callback) { ... },                          │      │    │
│  │   │    removeEventListener(type, callback) { ... }                        │      │    │
│  │   │  };                                                                   │      │    │
│  │   └──────────────────────────────────────────────────────────────────────┘      │    │
│  │                                                                                 │    │
│  │   Step 3: Listen for Responses                                                  │    │
│  │   ┌──────────────────────────────────────────────────────────────────────┐      │    │
│  │   │  window.addEventListener('message', (e) => {                          │      │    │
│  │   │    if (e.data?.type === 'SPECULOS_RESPONSE') {                        │      │    │
│  │   │      // Trigger inputreport event                                     │      │    │
│  │   │      const callbacks = window.__inputReportCallbacks || [];           │      │    │
│  │   │      callbacks.forEach(cb => cb({                                     │      │    │
│  │   │        type: 'inputreport',                                           │      │    │
│  │   │        device: window.__speculosDevice,                               │      │    │
│  │   │        data: new DataView(new Uint8Array(e.data.data).buffer),          │      │    │
│  │   │        reportId: e.data.reportId                                      │      │    │
│  │   │      }));                                                             │      │    │
│  │   │    }                                                                  │      │    │
│  │   │  });                                                                  │      │    │
│  │   └──────────────────────────────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ 3. postMessage('SPECULOS_APDU')
                                         │    (Browser → Test Runner)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           TEST RUNNER (Message Handler)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                     APDU Forwarding Loop (in test)                              │    │
│  │                                                                                 │    │
│  │   // In the E2E test, we listen for messages from the browser                  │    │
│  │   // and forward them to Speculos via TCP                                      │    │
│  │                                                                                 │    │
│  │   while (testRunning) {                                                        │    │
│  │     // 1. Wait for message from browser                                        │    │
│  │     const message = await driver.waitForMessage('SPECULOS_APDU');              │    │
│  │                                                                                 │    │
│  │     // 2. Convert to Buffer                                                    │    │
│  │     const apdu = Buffer.from(message.data);                                     │    │
│  │                                                                                 │    │
│  │     // 3. Send to Speculos via TCP                                             │    │
│  │     const response = await speculosClient.exchange(apdu);                       │    │
│  │                                                                                 │    │
│  │     // 4. Send response back to browser                                        │    │
│  │     await driver.executeScript((response) => {                                  │    │
│  │       window.postMessage({                                                     │    │
│  │         type: 'SPECULOS_RESPONSE',                                             │    │
│  │         data: Array.from(new Uint8Array(response)),                            │    │
│  │         reportId: message.reportId                                             │    │
│  │       }, '*');                                                                 │    │
│  │     }, response);                                                              │    │
│  │   }                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ 4. APDU over TCP
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           METAMASK EXTENSION (Background)                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                      LedgerOffscreenBridge (REAL BRIDGE)                        │    │
│  │                                                                                 │    │
│  │   Uses the REAL Ledger bridge, NOT FakeLedgerBridge                            │    │
│  │                                                                                 │    │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐   │    │
│  │   │  TransportWebHID.create()                                                │   │    │
│  │   │    ↓                                                                     │   │    │
│  │   │  navigator.hid.requestDevice()  →  Returns our mock device               │   │    │
│  │   │    ↓                                                                     │   │    │
│  │   │  device.open()                                                           │   │    │
│  │   │    ↓                                                                     │   │    │
│  │   │  device.sendReport(reportId, apdu)                                       │   │    │
│  │   │    ↓                                                                     │   │    │
│  │   │  // Mock device sends postMessage to test runner                         │   │    │
│  │   │  // Test runner forwards to Speculos                                     │   │    │
│  │   │  // Speculos processes APDU                                              │   │    │
│  │   │  // Response sent back via inputreport event                             │   │    │
│  │   │    ↓                                                                     │   │    │
│  │   │  // Real Ethereum app logic processes response                           │   │    │
│  │   │  // Returns signature/address to MetaMask                                │   │    │
│  │   └─────────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                                 │    │
│  │   Key Point: The extension thinks it's talking to a real Ledger device!        │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Flow

### Phase 1: Test Setup

```javascript
// test/e2e/tests/hardware-wallets/ledger/ledger-speculos.spec.ts

const speculosHelper = new SpeculosTestHelper();

before(async function () {
  // 1. Start Docker container with Speculos
  // 2. Wait for healthcheck to pass
  // 3. Connect TCP client to port 9999
  await speculosHelper.start();
});

after(async function () {
  // Cleanup: Stop container, close connections
  await speculosHelper.stop();
});
```

**What happens:**

1. `docker-compose up -d` starts Speculos with Ethereum app
2. Container exposes:
   - Port 9999: TCP APDU server
   - Port 5000: REST API (for screenshots/buttons)
3. Healthcheck waits for Speculos to be ready
4. `SpeculosClient.connect()` establishes TCP socket

### Phase 2: Browser Setup

```javascript
it('connects to Speculos', async function () {
  const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());

  await withFixtures({...}, async ({ driver }) => {
    // Inject mock WebHID BEFORE any Ledger operations
    await webHIDBridge.inject(driver);

    // Now MetaMask will use our mock device
    // instead of real WebHID
  });
});
```

**What happens:**

1. `inject(driver)` runs JavaScript in browser context
2. Replaces `navigator.hid` with mock implementation
3. Creates `window.__speculosDevice` - a fake HIDDevice
4. Sets up message passing between browser ↔ test runner

### Phase 3: MetaMask Connect Flow

```
User clicks "Connect Ledger"
    ↓
MetaMask calls: navigator.hid.requestDevice()
    ↓
Our mock returns: window.__speculosDevice
    ↓
MetaMask calls: device.open()
    ↓
Mock device: opened = true
    ↓
MetaMask sends APDU: device.sendReport(reportId, apduBuffer)
    ↓
Mock device posts message to test runner:
    window.parent.postMessage({
      type: 'SPECULOS_APDU',
      reportId: 0,
      data: [0xe0, 0x40, 0x00, 0x00, ...]  // Get public key APDU
    })
    ↓
Test runner receives message via driver
    ↓
Test runner forwards to Speculos:
    speculosClient.exchange(Buffer.from(apduData))
    ↓
Speculos processes APDU with real Ethereum app
    ↓
Speculos returns response via TCP socket
    ↓
Test runner sends back to browser:
    driver.executeScript((response) => {
      window.postMessage({
        type: 'SPECULOS_RESPONSE',
        data: response
      });
    })
    ↓
Browser triggers inputreport event
    ↓
MetaMask receives response, derives address
    ↓
Account appears in MetaMask!
```

### Phase 4: Transaction Signing Flow

```
User initiates transaction
    ↓
MetaMask shows confirmation screen
    ↓
MetaMask sends SIGN_TRANSACTION APDU
    ↓
Same flow as Phase 3 (APDU → Speculos → Response)
    ↓
Speculos shows transaction on "device screen"
    ↓
Test can take screenshot:
    await speculosHelper.getClient().getScreenshot()
    ↓
Test approves transaction:
    await speculosHelper.getClient().pressButton('both')
    ↓
Speculos returns signature
    ↓
MetaMask broadcasts signed transaction
```

## Key Components Explained

### 1. SpeculosClient (TCP Communication)

```typescript
// Manages TCP connection to Speculos APDU server
class SpeculosClient {
  async connect(): Promise<void>;
  async exchange(apdu: Buffer): Promise<Buffer>; // Send/Receive APDU
  async pressButton(button: 'left' | 'right' | 'both'): Promise<void>;
  async getScreenshot(): Promise<Buffer>;
}
```

**Protocol:**

- Connect to `127.0.0.1:9999` via TCP socket
- Send raw APDU bytes
- Receive response bytes (includes status code `9000` for success)

### 2. WebHIDSpeculosBridge (Browser Injection)

```typescript
// Injects mock WebHID API into browser
class WebHIDSpeculosBridge {
  async inject(driver): Promise<void>; // Replace navigator.hid
  async restore(driver): Promise<void>; // Restore original
  async handleAPDU(data): Promise<Buffer>; // Forward to Speculos
}
```

**How it works:**

- Uses `driver.executeScript()` to run code in browser
- Replaces global `navigator.hid` with mock
- Sets up bidirectional message passing

### 3. Mock HIDDevice

```typescript
// Implementation of HIDDevice interface
class SpeculosHIDDevice implements HIDDevice {
  vendorId = 0x2c97; // Ledger vendor ID
  productId = 0x0001;

  async sendReport(reportId: number, data: BufferSource): Promise<void> {
    // Called by @ledgerhq/hw-transport-webhid
    // Sends APDU to test runner via postMessage
  }

  addEventListener(type: 'inputreport', callback): void {
    // Called to receive responses
    // Triggered when test runner sends response back
  }
}
```

## Message Flow Detail

### Browser → Test Runner (APDU Request)

```javascript
// In browser (injected by inject())
async sendReport(reportId, data) {
  window.parent.postMessage({
    type: 'SPECULOS_APDU',
    reportId: reportId,
    data: Array.from(new Uint8Array(data))  // Convert to array for serialization
  }, '*');
}
```

### Test Runner → Speculos (TCP)

```typescript
// In test runner (Node.js)
async exchange(apdu: Buffer): Promise<Buffer> {
  // Send over TCP socket
  this.apduSocket.write(apdu);

  // Wait for response
  return new Promise((resolve) => {
    this.apduSocket.on('data', (data) => {
      resolve(data);  // Raw bytes from Speculos
    });
  });
}
```

### Test Runner → Browser (APDU Response)

```javascript
// In test runner
driver.executeScript((responseBytes) => {
  window.postMessage(
    {
      type: 'SPECULOS_RESPONSE',
      data: responseBytes,
      reportId: originalReportId,
    },
    '*',
  );
}, Array.from(response));
```

### Browser → MetaMask (Event)

```javascript
// In browser (injected code)
window.addEventListener('message', (e) => {
  if (e.data.type === 'SPECULOS_RESPONSE') {
    // Create HIDInputReportEvent
    const event = new HIDInputReportEvent('inputreport', {
      device: window.__speculosDevice,
      reportId: e.data.reportId,
      data: new DataView(new Uint8Array(e.data.data).buffer),
    });

    // Trigger callbacks registered by MetaMask
    window.__inputReportCallbacks.forEach((cb) => cb(event));
  }
});
```

## APDU Protocol Example

### Get Public Key

```
Request APDU:
┌────┬────┬────┬────┬────┬─────────────────────────────────────┐
│ CLA│ INS│ P1 │ P2 │ LC │ DATA (derivation path)              │
├────┼────┼────┼────┼────┼─────────────────────────────────────┤
│ E0 │ 40 │ 00 │ 00 │ 11 │ 05 80 00 00 2C 80 00 00 3C 80 00 00 │
└────┴────┴────┴────┴────┴─────────────────────────────────────┘

Response:
┌────────────────────────────────────────┬────┬────┐
│ PUBLIC KEY (65 bytes)                  │ SW1│ SW2│
├────────────────────────────────────────┼────┼────┤
│ 04 41 02...                            │ 90 │ 00 │
└────────────────────────────────────────┴────┴────┘
                                    Status: Success
```

### Sign Transaction

```
Request APDU:
┌────┬────┬────┬────┬──────────────────────────────────────────────────────────┐
│ E0 │ 04 │ 00 │ 00 │ <transaction data>                                       │
└────┴────┴────┴────┴──────────────────────────────────────────────────────────┘

Response:
┌────────────────────────────────────────┬────────────────────────────────────────┬────┬────┐
│ SIGNATURE R (32 bytes)                 │ SIGNATURE S (32 bytes)                 │ 90 │ 00 │
└────────────────────────────────────────┴────────────────────────────────────────┴────┴────┘
```

## Advantages of This Approach

1. **Real Firmware Testing**: Uses actual Ledger Ethereum app compiled binary
2. **Full Protocol Stack**: Tests APDU encoding/decoding, transport layer, error handling
3. **Deterministic**: Same seed → same keys → reproducible tests
4. **No Hardware Required**: Runs in CI/CD without physical devices
5. **Visual Debugging**: Screenshots show what user would see on device
6. **Button Automation**: Can automate approval flows

## Comparison: FakeLedgerBridge vs Speculos

| Aspect             | FakeLedgerBridge        | Speculos                |
| ------------------ | ----------------------- | ----------------------- |
| **Code Path**      | Bypasses transport/APDU | Full stack              |
| **Firmware**       | Mocked (local signing)  | Real Ethereum app       |
| **APDU Protocol**  | Skipped                 | Full protocol           |
| **Error Handling** | Simplified              | Real device errors      |
| **Screenshots**    | ❌                      | ✅                      |
| **Button Flows**   | ❌                      | ✅                      |
| **Speed**          | Fast                    | Slower (TCP + emulator) |
| **CI/CD**          | ✅                      | ✅                      |
| **Debugging**      | Console logs            | Screenshots + GDB       |

## Troubleshooting

### Speculos won't start

```bash
# Check Docker is running
docker ps

# Check logs
docker-compose -f test/e2e/speculos/docker-compose.yml logs

# Verify ports not in use
lsof -i :9999
lsof -i :5000
```

### Connection refused

```bash
# Check Speculos is healthy
curl http://localhost:5000/

# Verify TCP socket is listening
nc -zv localhost 9999
```

### APDU timeout

- Increase timeout in SpeculosClient options
- Check Ethereum app is loaded in Speculos
- Verify derivation path format

## Next Steps

1. **Add to CI/CD**: GitHub Actions workflow with Speculos service
2. **More Test Cases**: Transaction signing, typed data, multiple accounts
3. **Screenshots on Failure**: Automatic capture for debugging
4. **Button Automation**: Approve/reject flows
5. **Performance**: Parallel test runs with multiple Speculos instances
