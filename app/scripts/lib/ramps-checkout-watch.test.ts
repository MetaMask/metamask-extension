import { RampsOrderStatus } from '@metamask/ramps-controller';
import type { RampsController } from '@metamask/ramps-controller';
import { createEventBuilder } from '../../../shared/lib/analytics/create-event-builder';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { createWatchRampsCheckoutTab } from './ramps-checkout-watch';

describe('createWatchRampsCheckoutTab', () => {
  const callbackBase =
    'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

  beforeEach(() => {
    process.env.METAMASK_ENVIRONMENT = 'test';
    jest.spyOn(Date, 'now').mockReturnValue(5_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createHarness({
    orders = [],
  }: {
    orders?: {
      providerOrderId: string;
      id?: string;
      status: string;
      walletAddress?: string;
    }[];
  } = {}) {
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
      state: { orders },
      getOrderFromCallback: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/native-uuid',
        providerOrderId: 'native-uuid',
        status: 'PENDING',
      }),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
    };

    const trackEvent = jest.fn();
    const analytics = { trackEvent, createEventBuilder };

    const watch = createWatchRampsCheckoutTab(
      platform as never,
      rampsController as unknown as RampsController,
      analytics,
    );

    const checkoutAnalytics = {
      checkoutSessionId: 'session-abc',
      checkoutOpenedAt: 4_000,
      region: 'us-ca',
      orderCode: 'c-custom',
    };

    return {
      platform,
      rampsController,
      watch,
      trackEvent,
      checkoutAnalytics,
      getOnUpdated: () => onUpdated,
      getOnRemoved: () => onRemoved,
    };
  }

  it('closes the tab and resolves the order for redirect-only checkouts', async () => {
    const { platform, rampsController, watch, getOnUpdated, checkoutAnalytics } =
      createHarness();

    watch({
      tabId: 9,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
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

  it('marks the precreated stub pending immediately and resolves the real order on redirect', async () => {
    const stub = {
      providerOrderId: 'c-custom',
      status: RampsOrderStatus.Precreated,
      walletAddress: '0xabc',
    };
    const { platform, rampsController, watch, getOnUpdated, checkoutAnalytics } =
      createHarness({
        orders: [stub],
      });

    watch({
      tabId: 3,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: true,
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      3,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(platform.closeTab).toHaveBeenCalledWith(3);
    expect(rampsController.addOrder).toHaveBeenCalledWith({
      ...stub,
      status: RampsOrderStatus.Pending,
    });
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
    expect(rampsController.removeOrder).toHaveBeenCalledWith('c-custom');
  });

  it('restores the precreated stub when the callback order cannot be resolved', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const stub = {
      providerOrderId: 'c-custom',
      status: RampsOrderStatus.Precreated,
      walletAddress: '0xabc',
    };
    const { rampsController, watch, getOnUpdated } = createHarness({
      orders: [stub],
    });
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('callback lookup failed'),
    );

    watch({
      tabId: 7,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: true,
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(
      7,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.addOrder.mock.calls).toMatchSnapshot();
    expect(rampsController.removeOrder).not.toHaveBeenCalled();
  });

  it('does not remove the stub when the resolved order shares its code', async () => {
    const stub = {
      providerOrderId: 'same-code',
      status: RampsOrderStatus.Precreated,
      walletAddress: '0xabc',
    };
    const { rampsController, watch, getOnUpdated, checkoutAnalytics } =
      createHarness({
        orders: [stub],
      });
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/same-code',
      providerOrderId: 'same-code',
      status: 'PENDING',
    });

    watch({
      tabId: 4,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: true,
      ...checkoutAnalytics,
      orderCode: 'same-code',
    });

    getOnUpdated()?.(
      4,
      { url: `${callbackBase}?transactionId=same-code` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.removeOrder).not.toHaveBeenCalled();
  });

  it('tears down listeners when the user closes the checkout tab', () => {
    const { platform, watch, getOnRemoved, checkoutAnalytics } = createHarness();

    watch({
      tabId: 5,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
    });

    getOnRemoved()?.(5);

    expect(platform.removeTabUpdatedListener).toHaveBeenCalled();
    expect(platform.removeTabRemovedListener).toHaveBeenCalled();
    expect(platform.closeTab).not.toHaveBeenCalled();
  });

  it('tracks callback and closed analytics when the callback URL is reached', () => {
    const { watch, getOnUpdated, trackEvent, checkoutAnalytics } =
      createHarness();

    watch({
      tabId: 9,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent.mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutCallbackDetected,
    );
    expect(trackEvent.mock.calls[1][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(trackEvent.mock.calls[1][0].properties).toMatchObject({
      close_source: 'callback_success',
      callback_reached: true,
    });
  });

  it('tracks checkout closed when the user closes the tab before callback', () => {
    const { watch, getOnRemoved, trackEvent, checkoutAnalytics } =
      createHarness();

    watch({
      tabId: 5,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
    });

    getOnRemoved()?.(5);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent.mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(trackEvent.mock.calls[0][0].properties).toMatchObject({
      close_source: 'user_close_button',
      callback_reached: false,
    });
  });
});
