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
      state: { orders: [] },
      getOrderFromCallback: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/native-uuid',
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
      getOrder: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/native-uuid',
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
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

  it('closes the tab and resolves the order from the callback URL', async () => {
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
    expect(rampsController.addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
    );
    expect(rampsController.getOrder).not.toHaveBeenCalled();
  });

  it('falls back to getOrder by widget code when the callback lookup fails', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { rampsController, watch, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    watch({
      tabId: 7,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(
      7,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.getOrder).toHaveBeenCalledWith(
      'moonpay',
      'c-custom',
      '0xabc',
    );
    expect(rampsController.addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
    );
    expect(rampsController.addOrder.mock.calls).toMatchSnapshot();
  });

  it('does not add an order when both the callback and the lookup fail', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { rampsController, watch, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );
    rampsController.getOrder.mockRejectedValue(new Error('Failed to fetch'));

    watch({
      tabId: 8,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(
      8,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.addOrder).not.toHaveBeenCalled();
    expect(rampsController.addOrder.mock.calls).toMatchSnapshot();
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
