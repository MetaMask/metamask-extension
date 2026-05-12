import type browser from 'webextension-polyfill';
import { registerHyperliquidDepositModalListener } from './hyperliquid-deposit-modal-background';

describe('registerHyperliquidDepositModalListener', () => {
  const getRuntime = () => {
    let listener:
      | ((
          message: unknown,
          sender: browser.Runtime.MessageSender,
        ) => Promise<unknown>)
      | undefined;

    return {
      runtime: {
        onMessage: {
          addListener: jest.fn((nextListener) => {
            listener = nextListener;
          }),
          removeListener: jest.fn((nextListener) => {
            if (listener === nextListener) {
              listener = undefined;
            }
          }),
        },
      },
      sendMessageToListener: (message: unknown, senderUrl?: string) =>
        listener?.(message, {
          url: senderUrl,
          tab: { id: 123 },
          frameId: 0,
        } as browser.Runtime.MessageSender),
    };
  };

  it('triggers UI for validated Hyperliquid detection messages', async () => {
    const { runtime, sendMessageToListener } = getRuntime();
    const openDepositFlow = jest.fn().mockResolvedValue(undefined);

    registerHyperliquidDepositModalListener({
      runtime,
      openDepositFlow,
      now: () => 1_000,
      logger: { info: jest.fn(), warn: jest.fn() },
    });

    const result = await sendMessageToListener(
      {
        type: 'metamask:hyperliquidDepositModalDetected',
        payload: {
          detectedAt: 1_000,
          matchedSignals: ['deposit', 'usdc'],
          element: { tagName: 'div', role: 'dialog' },
        },
      },
      'https://app.hyperliquid.xyz/trade',
    );

    expect(result).toStrictEqual({ acknowledged: true });
    expect(openDepositFlow).toHaveBeenCalledWith({
      tabId: 123,
      windowId: undefined,
    });
  });

  it('ignores messages from other origins', async () => {
    const { runtime, sendMessageToListener } = getRuntime();
    const openDepositFlow = jest.fn();

    registerHyperliquidDepositModalListener({
      runtime,
      openDepositFlow,
      logger: { info: jest.fn(), warn: jest.fn() },
    });

    const result = await sendMessageToListener(
      {
        type: 'metamask:hyperliquidDepositModalDetected',
        payload: {
          detectedAt: 1_000,
          matchedSignals: ['deposit', 'usdc'],
          element: { tagName: 'div', role: 'dialog' },
        },
      },
      'https://example.com',
    );

    expect(result).toStrictEqual({
      acknowledged: false,
      reason: 'invalid-origin',
    });
    expect(openDepositFlow).not.toHaveBeenCalled();
  });

  it('debounces repeated valid detections', async () => {
    const { runtime, sendMessageToListener } = getRuntime();
    const openDepositFlow = jest.fn().mockResolvedValue(undefined);
    let now = 1_000;

    registerHyperliquidDepositModalListener({
      runtime,
      openDepositFlow,
      now: () => now,
      triggerCooldownMs: 30_000,
      logger: { info: jest.fn(), warn: jest.fn() },
    });

    const message = {
      type: 'metamask:hyperliquidDepositModalDetected',
      payload: {
        detectedAt: 1_000,
        matchedSignals: ['deposit', 'usdc'],
        element: { tagName: 'div', role: 'dialog' },
      },
    };

    await sendMessageToListener(message, 'https://app.hyperliquid.xyz/trade');

    now += 1_000;
    const debounced = await sendMessageToListener(
      message,
      'https://app.hyperliquid.xyz/trade',
    );

    now += 30_000;
    await sendMessageToListener(message, 'https://app.hyperliquid.xyz/trade');

    expect(debounced).toStrictEqual({
      acknowledged: true,
      suppressed: true,
    });
    expect(openDepositFlow).toHaveBeenCalledTimes(2);
  });
});
