import type { RampsController } from '@metamask/ramps-controller';
import { createWatchRampsCheckoutTab } from './ramps-checkout-watch';

describe('createWatchRampsCheckoutTab', () => {
  const callbackBase =
    'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

  beforeEach(() => {
    process.env.METAMASK_ENVIRONMENT = 'test';
  });

  function createHarness() {
    let onUpdated:
      | ((
          tabId: number,
          changeInfo: { url?: string; pendingUrl?: string },
          tab?: { url?: string },
        ) => void)
      | undefined;
    let onRemoved: ((tabId: number) => void) | undefined;

    const platform = {
      addTabUpdatedListener: jest.fn((listener) => {
        onUpdated = listener;
      }),
      addTabRemovedListener: jest.fn((listener) => {
        onRemoved = listener;
      }),
      removeTabUpdatedListener: jest.fn(),
      removeTabRemovedListener: jest.fn(),
      closeTab: jest.fn().mockResolvedValue(undefined),
    };

    const rampsController = {
      getOrderFromCallback: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/native-uuid',
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
      addOrder: jest.fn(),
    };

    const watch = createWatchRampsCheckoutTab(
      platform as never,
      rampsController as unknown as RampsController,
    );

    return {
      platform,
      rampsController,
      watch,
      getOnUpdated: () => onUpdated,
      getOnRemoved: () => onRemoved,
    };
  }

  it('closes the tab and resolves the order for redirect-only checkouts', async () => {
    const { platform, rampsController, watch, getOnUpdated } = createHarness();

    watch({
      tabId: 9,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(platform.closeTab).toHaveBeenCalledWith(9);
    expect(rampsController.getOrderFromCallback).toHaveBeenCalledWith(
      'moonpay',
      `${callbackBase}?transactionId=abc`,
      '0xabc',
    );
    expect(rampsController.addOrder).toHaveBeenCalled();
  });

  it('logs when the callback order cannot be resolved', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { rampsController, watch, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('callback lookup failed'),
    );

    watch({
      tabId: 7,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnUpdated()?.(
      7,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect({
      errorCalls: jest.mocked(console.error).mock.calls,
      addOrderCalls: rampsController.addOrder.mock.calls,
    }).toMatchSnapshot();
  });

  it('tears down listeners when the user closes the checkout tab', () => {
    const { platform, watch, getOnRemoved } = createHarness();

    watch({
      tabId: 5,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnRemoved()?.(5);

    expect(platform.removeTabUpdatedListener).toHaveBeenCalled();
    expect(platform.removeTabRemovedListener).toHaveBeenCalled();
    expect(platform.closeTab).not.toHaveBeenCalled();
  });
});
