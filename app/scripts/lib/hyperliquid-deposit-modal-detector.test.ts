/**
 * @jest-environment jsdom
 */

import {
  getHyperliquidDepositModalDetection,
  initHyperliquidDepositModalDetector,
  isHyperliquidDepositModalDetectionTarget,
  startHyperliquidDepositModalDetector,
} from './hyperliquid-deposit-modal-detector';

describe('hyperliquid deposit modal detector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('identifies the Hyperliquid app origin as a detection target', () => {
    expect(
      isHyperliquidDepositModalDetectionTarget({
        origin: 'https://app.hyperliquid.xyz',
      } as Location),
    ).toBe(true);

    expect(
      isHyperliquidDepositModalDetectionTarget({
        origin: 'https://example.com',
      } as Location),
    ).toBe(false);
  });

  it('detects a visible deposit dialog with supporting deposit signals', () => {
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
        <button>Max</button>
      </div>
    `;

    const detection = getHyperliquidDepositModalDetection(document, () => 123);

    expect(detection).toStrictEqual({
      detectedAt: 123,
      matchedSignals: ['deposit', 'usdc', 'amount', 'max'],
      element: {
        tagName: 'div',
        role: 'dialog',
        ariaModal: 'true',
      },
    });
  });

  it('does not detect non-modal page content that mentions deposits', () => {
    document.body.innerHTML = `
      <main>
        <h1>Deposit USDC</h1>
        <p>Amount</p>
      </main>
    `;

    expect(getHyperliquidDepositModalDetection(document)).toBeNull();
  });

  it('does not detect hidden dialog content', () => {
    document.body.innerHTML = `
      <div role="dialog" hidden>
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    expect(getHyperliquidDepositModalDetection(document)).toBeNull();
  });

  it('detects a fixed overlay that lacks explicit dialog attributes', () => {
    document.body.innerHTML = `
      <div style="position: fixed; z-index: 100;">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    expect(getHyperliquidDepositModalDetection(document)).toMatchObject({
      matchedSignals: ['deposit', 'usdc', 'amount'],
      element: {
        tagName: 'div',
      },
    });
  });

  it('observes modal insertion once until the modal closes and reopens', async () => {
    jest.useFakeTimers();
    const onDetected = jest.fn();
    let now = 1_000;

    const stop = startHyperliquidDepositModalDetector({
      doc: document,
      onDetected,
      now: () => now,
      detectionCooldownMs: 30_000,
    });

    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(1);

    now += 1_000;
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
        <button>Max</button>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(1);

    now += 30_000;
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
        <button>Max</button>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(1);

    document.body.innerHTML = '';

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    now += 30_000;
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
        <button>Max</button>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(2);

    stop();
  });

  it('observes modal visibility changes through style attributes', async () => {
    jest.useFakeTimers();
    const onDetected = jest.fn();

    startHyperliquidDepositModalDetector({
      doc: document,
      onDetected,
      now: () => 1_000,
    });

    document.body.innerHTML = `
      <div role="dialog" aria-modal="true" style="display: none;">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).not.toHaveBeenCalled();

    document.querySelector<HTMLElement>('[role="dialog"]')?.removeAttribute(
      'style',
    );

    await Promise.resolve();
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('schedules detection after user interaction', () => {
    jest.useFakeTimers();
    const onDetected = jest.fn();

    startHyperliquidDepositModalDetector({
      doc: document,
      onDetected,
      now: () => 1_000,
    });

    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    jest.runOnlyPendingTimers();

    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it('sends a minimal runtime message when initialized on Hyperliquid', async () => {
    jest.useFakeTimers();
    const sendMessage = jest.fn().mockResolvedValue(undefined);

    initHyperliquidDepositModalDetector({
      doc: document,
      enabled: true,
      location: { origin: 'https://app.hyperliquid.xyz' } as Location,
      runtime: { sendMessage },
    });

    document.body.innerHTML = `
      <div role="dialog" aria-modal="true">
        <h2>Deposit USDC</h2>
        <label>Amount</label>
      </div>
    `;

    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'metamask:hyperliquidDepositModalDetected',
      payload: expect.objectContaining({
        matchedSignals: ['deposit', 'usdc', 'amount'],
        element: {
          tagName: 'div',
          role: 'dialog',
          ariaModal: 'true',
        },
      }),
    });
  });

  it('does not initialize on unrelated origins', () => {
    const sendMessage = jest.fn();

    expect(
      initHyperliquidDepositModalDetector({
        doc: document,
        enabled: true,
        location: { origin: 'https://example.com' } as Location,
        runtime: { sendMessage },
      }),
    ).toBeUndefined();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not initialize when the POC flag is disabled', () => {
    const sendMessage = jest.fn();

    expect(
      initHyperliquidDepositModalDetector({
        doc: document,
        enabled: false,
        location: { origin: 'https://app.hyperliquid.xyz' } as Location,
        runtime: { sendMessage },
      }),
    ).toBeUndefined();

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
