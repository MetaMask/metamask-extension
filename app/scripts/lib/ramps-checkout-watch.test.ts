/* eslint-disable @typescript-eslint/naming-convention */
import { RampsOrderStatus } from '@metamask/ramps-controller';
import type { RampsController } from '@metamask/ramps-controller';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { trackEvent } from '../controllers/analytics';
import { createWatchRampsCheckoutTab } from './ramps-checkout-watch';

jest.mock('../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../controllers/analytics')
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

    const watch = createWatchRampsCheckoutTab(
      platform as never,
      rampsController as unknown as RampsController,
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
      checkoutAnalytics,
      getOnUpdated: () => onUpdated,
      getOnRemoved: () => onRemoved,
    };
  }

  it('closes the tab and resolves the order for redirect-only checkouts', async () => {
    const {
      platform,
      rampsController,
      watch,
      getOnUpdated,
      checkoutAnalytics,
    } = createHarness();

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
    const {
      platform,
      rampsController,
      watch,
      getOnUpdated,
      checkoutAnalytics,
    } = createHarness({
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
    const { rampsController, watch, getOnUpdated, checkoutAnalytics } =
      createHarness({
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
      ...checkoutAnalytics,
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
    const { platform, watch, getOnRemoved, checkoutAnalytics } =
      createHarness();

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
    const { watch, getOnUpdated, checkoutAnalytics } = createHarness();

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
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutCallbackDetected,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(jest.mocked(trackEvent).mock.calls[1][0].properties).toMatchObject({
      close_source: 'callback_success',
      callback_reached: true,
    });
  });

  it('counts one step per navigation, not per tab update event', () => {
    const { watch, getOnUpdated, checkoutAnalytics } = createHarness();

    watch({
      tabId: 9,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
    });

    const providerUrl = 'https://provider.example/checkout/kyc';
    // One provider page load: the URL arrives with `status: 'loading'`, then
    // further updates (complete, title, favicon) carry no URL of their own.
    getOnUpdated()?.(9, { url: providerUrl }, { url: providerUrl });
    getOnUpdated()?.(9, {}, { url: providerUrl });
    getOnUpdated()?.(9, {}, { url: providerUrl });

    const callbackUrl = `${callbackBase}?transactionId=abc`;
    getOnUpdated()?.(9, { url: callbackUrl }, { url: callbackUrl });

    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      step_index: 2,
    });
  });

  it('tracks the terminal KPI for an order resolved already-completed from the callback', async () => {
    const { rampsController, watch, getOnUpdated, checkoutAnalytics } =
      createHarness();
    rampsController.getOrderFromCallback.mockResolvedValue({
      id: 'moonpay/orders/already-done',
      providerOrderId: 'already-done',
      status: 'COMPLETED',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    });

    watch({
      tabId: 11,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
      orderCode: undefined,
    });

    getOnUpdated()?.(
      11,
      { url: `${callbackBase}?transactionId=already-done` },
      undefined,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(
      jest.mocked(trackEvent).mock.calls.map(([event]) => event.name),
    ).toContain(MetaMetricsEventName.RampsTransactionCompleted);
  });

  it('tracks checkout closed when the user closes the tab before callback', () => {
    const { watch, getOnRemoved, checkoutAnalytics } = createHarness();

    watch({
      tabId: 5,
      providerCode: 'moonpay',
      walletAddress: '0xabc',
      orderAlreadyPrecreated: false,
      ...checkoutAnalytics,
    });

    getOnRemoved()?.(5);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsCheckoutClosed,
    );
    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      close_source: 'user_close_button',
      callback_reached: false,
    });
  });
});
