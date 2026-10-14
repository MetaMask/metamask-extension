/* eslint-disable @typescript-eslint/naming-convention */
import type { RampsController } from '@metamask/ramps-controller';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import {
  createWatchRampsCheckoutTab,
  createWatchRampsOrderTab,
} from './checkout-watch';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

describe('createWatchRampsCheckoutTab', () => {
  const callbackBase =
    'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

  beforeEach(() => {
    process.env.METAMASK_ENVIRONMENT = 'test';
    jest.mocked(trackEvent).mockClear();
    jest.spyOn(Date, 'now').mockReturnValue(5_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
        orderType: 'BUY',
      }),
      getOrder: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/native-uuid',
        providerOrderId: 'native-uuid',
        status: 'PENDING',
        orderType: 'BUY',
      }),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
    };

    const watch = createWatchRampsCheckoutTab(
      platform as never,
      rampsController as unknown as RampsController,
    );
    const watchOrder = createWatchRampsOrderTab(
      platform as never,
      rampsController as unknown as RampsController,
    );

    const checkoutAnalytics = {
      checkoutSessionId: 'session-abc',
      region: 'us-ca',
    };

    return {
      platform,
      rampsController,
      watch,
      watchOrder,
      checkoutAnalytics,
      getOnUpdated: () => onUpdated,
      getOnRemoved: () => onRemoved,
    };
  }

  it('tracks checkout opened with provider name and callback flow flag', async () => {
    const { watch, checkoutAnalytics } = createHarness();

    await watch({
      url: 'https://provider.example/checkout?session=xyz',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      providerName: 'MoonPay',
      orderCode: 'c-order',
      ...checkoutAnalytics,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsCheckoutOpened);
    expect(built.properties).toMatchObject({
      provider_name: 'MoonPay',
      initial_url_path: '/checkout',
      // A precreated order still redirects through the callback URL.
      has_callback_flow: true,
      order_id: 'c-order',
    });
  });

  it('reports has_callback_flow false when the callback cannot be attributed', async () => {
    const { watch, checkoutAnalytics } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: '',
      walletAddress: '',
      providerName: 'MoonPay',
      ...checkoutAnalytics,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.properties).toMatchObject({
      has_callback_flow: false,
    });
  });

  it('opens the checkout tab then watches for the callback URL', async () => {
    const {
      platform,
      rampsController,
      watch,
      checkoutAnalytics,
      getOnUpdated,
    } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
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
        orderType: 'BUY',
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
    const {
      platform,
      rampsController,
      watch,
      checkoutAnalytics,
      getOnUpdated,
    } = createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
      ...checkoutAnalytics,
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
        orderType: 'BUY',
      }),
    );
    expect(platform.closeTab).toHaveBeenCalledWith(9);
  });

  it('does not add an order when both the callback and the lookup fail', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { rampsController, watch, checkoutAnalytics, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );
    rampsController.getOrder.mockRejectedValue(new Error('Failed to fetch'));

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
      ...checkoutAnalytics,
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

  it('throws when the opened checkout tab has no id and does not track checkout opened', async () => {
    const { platform, watch, checkoutAnalytics } = createHarness();
    platform.openTab.mockResolvedValue({});

    await expect(
      watch({
        url: 'https://provider.example/checkout',
        providerCode: 'moonpay',
        walletAddress: '0xabc',
        ...checkoutAnalytics,
      }),
    ).rejects.toThrow('Failed to open ramps checkout tab');

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tears down listeners when the user closes the checkout tab', async () => {
    const { platform, watch, checkoutAnalytics, getOnRemoved } =
      createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    getOnRemoved()?.(9);

    expect(platform.removeTabUpdatedListener).toHaveBeenCalled();
    expect(platform.removeTabRemovedListener).toHaveBeenCalled();
    expect(platform.closeTab).not.toHaveBeenCalled();
  });

  it('tracks checkout opened, callback, and closed analytics when the callback URL is reached', async () => {
    const { watch, checkoutAnalytics, getOnUpdated } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      providerName: 'MoonPay',
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=abc` },
      undefined,
    );

    expect(trackEvent).toHaveBeenCalledTimes(3);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutOpened,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutCallbackDetected,
    );
    expect(jest.mocked(trackEvent).mock.calls[2][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].properties).toMatchObject({
      provider_name: 'MoonPay',
    });
    expect(jest.mocked(trackEvent).mock.calls[2][0].properties).toMatchObject({
      close_source: 'callback_success',
      callback_reached: true,
      provider_name: 'MoonPay',
    });
  });

  it('counts one step per navigation, not per tab update event', async () => {
    const { watch, checkoutAnalytics, getOnUpdated } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    const providerUrl = 'https://provider.example/checkout/kyc';
    // One provider page load: the URL is committed as `pendingUrl`, arrives
    // again as `url` once it loads, then further updates (complete, title,
    // favicon) carry no URL of their own.
    getOnUpdated()?.(9, { pendingUrl: providerUrl }, { url: providerUrl });
    getOnUpdated()?.(9, { url: providerUrl }, { url: providerUrl });
    getOnUpdated()?.(9, {}, { url: providerUrl });
    getOnUpdated()?.(9, {}, { url: providerUrl });

    const callbackUrl = `${callbackBase}?transactionId=abc`;
    getOnUpdated()?.(9, { url: callbackUrl }, { url: callbackUrl });

    expect(jest.mocked(trackEvent).mock.calls[1][0].properties).toMatchObject({
      step_index: 2,
    });
  });

  it('tracks the terminal KPI for an order resolved already-completed from the callback', async () => {
    const { rampsController, watch, checkoutAnalytics, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/already-done',
      providerOrderId: 'already-done',
      status: 'COMPLETED',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=already-done` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(
      jest.mocked(trackEvent).mock.calls.map(([event]) => event.name),
    ).toContain(MetaMetricsEventName.RampsTransactionCompleted);
  });

  it('tracks ramps-transaction-confirmed for a non-terminal callback order', async () => {
    const { rampsController, watch, checkoutAnalytics, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/pending-order',
      providerOrderId: 'pending-order',
      status: 'PENDING',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=pending-order` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const eventNames = jest
      .mocked(trackEvent)
      .mock.calls.map(([event]) => event.name);
    expect(eventNames).toContain(
      MetaMetricsEventName.RampsTransactionConfirmed,
    );
    expect(eventNames).not.toContain(
      MetaMetricsEventName.RampsTransactionCompleted,
    );
  });

  it('passes the checkout region to ramps-transaction-confirmed', async () => {
    const { rampsController, watch, checkoutAnalytics, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/region-check-order',
      providerOrderId: 'region-check-order',
      status: 'PENDING',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
      region: 'de',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=region-check-order` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const confirmedCall = jest
      .mocked(trackEvent)
      .mock.calls.find(
        ([event]) =>
          event.name === MetaMetricsEventName.RampsTransactionConfirmed,
      );
    expect(confirmedCall?.[0].properties).toMatchObject({
      region: 'de',
      country: 'de',
    });
  });

  it('threads checkout_session_id to the terminal KPI from the watcher context', async () => {
    const { rampsController, watch, checkoutAnalytics, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/session-thread-test',
      providerOrderId: 'session-thread-test',
      status: 'COMPLETED',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?transactionId=session-thread-test` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const completedCall = jest
      .mocked(trackEvent)
      .mock.calls.find(
        ([event]) =>
          event.name === MetaMetricsEventName.RampsTransactionCompleted,
      );
    expect(completedCall?.[0].properties).toMatchObject({
      checkout_session_id: 'session-abc',
    });
  });

  it('tracks checkout opened and closed when the user closes the tab before callback', async () => {
    const { watch, checkoutAnalytics, getOnRemoved } = createHarness();

    await watch({
      url: 'https://provider.example/checkout',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      ...checkoutAnalytics,
    });

    getOnRemoved()?.(9);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutOpened,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].properties).toMatchObject({
      close_source: 'user_close_button',
      callback_reached: false,
    });
  });
});

describe('createWatchRampsOrderTab', () => {
  const callbackBase =
    'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

  beforeEach(() => {
    process.env.METAMASK_ENVIRONMENT = 'test';
    jest.mocked(trackEvent).mockClear();
    jest.spyOn(Date, 'now').mockReturnValue(5_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
        id: 'moonpay/orders/reentry-uuid',
        providerOrderId: 'reentry-uuid',
        status: 'PENDING',
        orderType: 'BUY',
      }),
      getOrder: jest.fn().mockResolvedValue({
        id: 'moonpay/orders/reentry-uuid',
        providerOrderId: 'reentry-uuid',
        status: 'PENDING',
        orderType: 'BUY',
      }),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
    };

    const watchOrder = createWatchRampsOrderTab(
      platform as never,
      rampsController as unknown as RampsController,
    );

    return {
      platform,
      rampsController,
      watchOrder,
      getOnUpdated: () => onUpdated,
      getOnRemoved: () => onRemoved,
    };
  }

  it('opens the order tab and watches for the callback URL without checkout funnel events', async () => {
    const { platform, rampsController, watchOrder, getOnUpdated } =
      createHarness();

    await watchOrder({
      url: 'https://provider.example/order/abc',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-order',
    });

    expect(platform.openTab).toHaveBeenCalledWith({
      url: 'https://provider.example/order/abc',
    });

    getOnUpdated()?.(9, { url: `${callbackBase}?orderRef=abc` }, undefined);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.getOrderFromCallback).toHaveBeenCalledWith(
      'moonpay',
      `${callbackBase}?orderRef=abc`,
      '0xabc',
    );
    expect(rampsController.addOrder).toHaveBeenCalled();
    expect(platform.openTab).toHaveBeenCalledWith({
      url: 'chrome-extension://mm/home.html#/activity',
    });
    expect(platform.closeTab).toHaveBeenCalledWith(9);

    const eventNames = jest
      .mocked(trackEvent)
      .mock.calls.map(([event]) => event.name);
    expect(eventNames).not.toContain(MetaMetricsEventName.RampsCheckoutOpened);
    expect(eventNames).not.toContain(MetaMetricsEventName.RampsCheckoutClosed);
    expect(eventNames).not.toContain(
      MetaMetricsEventName.RampsCheckoutCallbackDetected,
    );
  });

  it('matches the callback URL even when the provider omits the query separator', async () => {
    // TRAM-3995: Banxa's "Return to MetaMask" redirect concatenates `orderRef=`
    // straight onto the callback base URL with no `?`.
    const { rampsController, watchOrder, getOnUpdated } = createHarness();

    await watchOrder({
      url: 'https://provider.example/order/abc',
      providerCode: 'banxa',
      walletAddress: '0xabc',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}orderRef=01a07ad98b` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.getOrderFromCallback).toHaveBeenCalledWith(
      'banxa',
      `${callbackBase}orderRef=01a07ad98b`,
      '0xabc',
    );
  });

  it('falls back to getOrder by order code when the callback lookup fails', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const { platform, rampsController, watchOrder, getOnUpdated } =
      createHarness();
    rampsController.getOrderFromCallback.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    await watchOrder({
      url: 'https://provider.example/order/abc',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderCode: 'c-custom',
    });

    getOnUpdated()?.(9, { url: `${callbackBase}?orderRef=abc` }, undefined);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(rampsController.getOrder).toHaveBeenCalledWith(
      'moonpay',
      'c-custom',
      '0xabc',
    );
    expect(rampsController.addOrder).toHaveBeenCalled();
    expect(platform.closeTab).toHaveBeenCalledWith(9);
  });

  it('does not emit checkout closed analytics when the user closes the tab', async () => {
    const { platform, watchOrder, getOnRemoved } = createHarness();

    await watchOrder({
      url: 'https://provider.example/order/abc',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnRemoved()?.(9);

    expect(trackEvent).not.toHaveBeenCalled();
    expect(platform.closeTab).not.toHaveBeenCalled();
  });

  it('does not track terminal KPI for a completed order without checkout context', async () => {
    const { rampsController, watchOrder, getOnUpdated } = createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/reentry-done',
      providerOrderId: 'reentry-done',
      status: 'COMPLETED',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    await watchOrder({
      url: 'https://provider.example/order/abc',
      providerCode: 'moonpay',
      walletAddress: '0xabc',
    });

    getOnUpdated()?.(
      9,
      { url: `${callbackBase}?orderRef=reentry-done` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const completedCall = jest
      .mocked(trackEvent)
      .mock.calls.find(
        ([event]) =>
          event.name === MetaMetricsEventName.RampsTransactionCompleted,
      );
    expect(completedCall).toBeUndefined();
  });
});
