import type { RampsController } from '@metamask/ramps-controller';
import { createWatchRampsCheckoutTab } from './checkout-watch';

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
      openTab: jest.fn().mockResolvedValue({ id: 9 }),
      getExtensionURL: jest.fn((route?: string | null) =>
        route
          ? `chrome-extension://mm/home.html#${route}`
          : 'chrome-extension://mm/home.html',
      ),
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

  it('opens the checkout tab then watches for the callback URL', async () => {
    const { platform, rampsController, watch, getOnUpdated } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    expect(platform.openTab).toHaveBeenCalledWith({
      url: 'https://provider.example/checkout',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

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
    expect(platform.openTab).toHaveBeenCalledWith({
      url: 'chrome-extension://mm/home.html#/activity',
    });
    expect(platform.closeTab).toHaveBeenCalledWith(9);
    expect(rampsController.getOrder).not.toHaveBeenCalled();
  });

  it('falls back to getOrder by widget code when the callback lookup fails', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { platform, rampsController, watch, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(
      9,
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
    expect(platform.closeTab).toHaveBeenCalledWith(9);
  });

  it('does not add an order when both the callback and the lookup fail', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { rampsController, watch, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );
    rampsController.getOrder.mockRejectedValue(new Error('Failed to fetch'));

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.addOrder).not.toHaveBeenCalled();
  });

  it('throws when the opened checkout tab has no id', async () => {
    const { platform, watch } = createHarness();
    platform.openTab.mockResolvedValue({});

    await expect(
      watch({
        url: 'https://provider.example/checkout',
        providerCode: 'moonpay',
        walletAddress: '0xabc',
      }),
    ).rejects.toThrow('Failed to open ramps checkout tab');
  });

  it('tears down listeners when the user closes the checkout tab', async () => {
    const { platform, watch, getOnRemoved } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnRemoved()?.(9);

    expect(platform.removeTabUpdatedListener).toHaveBeenCalled();
    expect(platform.removeTabRemovedListener).toHaveBeenCalled();
    expect(platform.closeTab).not.toHaveBeenCalled();
  });
});
