export {}; // Ensure this file is treated as a module

const LEDGER_VENDOR_ID = 0x2c97;
const RESPONSE_TIMEOUT_MS = 30_000;

const statusEl = document.getElementById('status') as HTMLDivElement;
const grantBtn = document.getElementById('grant') as HTMLButtonElement;
const testBtn = document.getElementById('test') as HTMLButtonElement;

function log(msg: unknown, cls?: string) {
  const p = document.createElement('pre');
  if (cls) {
    p.className = cls;
  }
  p.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
  statusEl.appendChild(p);
}

grantBtn.addEventListener('click', async () => {
  try {
    log('Requesting HID device access...');

    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: LEDGER_VENDOR_ID }],
    });

    if (devices.length > 0) {
      log(`Permission granted for: ${devices[0].productName}`, 'success');
      testBtn.disabled = false;
    } else {
      log('No device selected.', 'error');
    }
  } catch (err) {
    log(`Permission error: ${(err as Error).message}`, 'error');
  }
});

testBtn.addEventListener('click', async () => {
  log('Sending test message to offscreen document...');

  testBtn.disabled = true;
  try {
    const response = await Promise.race([
      chrome.runtime.sendMessage({
        target: 'ledger-btc-offscreen',
        action: 'ledger-btc-test',
      }),

      new Promise((_resolve, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          RESPONSE_TIMEOUT_MS,
        ),
      ),
    ]);
    const { success, payload } = (response ?? {}) as {
      success?: boolean;
      payload?: unknown;
    };

    if (success) {
      log('Test passed!', 'success');
      log(payload);
    } else {
      log('Test failed:', 'error');
      log(payload ?? response ?? 'No response');
    }
  } catch (err) {
    log(`Error: ${(err as Error).message}`, 'error');
  } finally {
    testBtn.disabled = false;
  }
});
