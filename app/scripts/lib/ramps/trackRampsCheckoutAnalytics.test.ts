/* eslint-disable @typescript-eslint/naming-convention */
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import {
  trackRampsCheckoutCallbackDetected,
  trackRampsCheckoutClosed,
  trackRampsCheckoutOpened,
} from './trackRampsCheckoutAnalytics';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

describe('trackRampsCheckoutAnalytics', () => {
  const context = {
    checkoutSessionId: 'session-1',
    checkoutOpenedAt: 1_000,
    region: 'us-ca',
    orderCode: 'order-abc',
    providerName: 'Transak',
  };

  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
    jest.spyOn(Date, 'now').mockReturnValue(2_500);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks checkout opened with provider name and sanitized url path', () => {
    trackRampsCheckoutOpened({
      ...context,
      checkoutUrl: 'https://provider.example/checkout?session=abc',
      hasCallbackFlow: false,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsCheckoutOpened);
    expect(built.properties).toMatchObject({
      checkout_session_id: 'session-1',
      provider_name: 'Transak',
      initial_url_path: '/checkout',
      has_callback_flow: false,
      order_id: 'order-abc',
      region: 'us-ca',
    });
  });

  it('tracks checkout opened with has_callback_flow true when no order code', () => {
    trackRampsCheckoutOpened({
      checkoutSessionId: 'session-1',
      checkoutOpenedAt: 1_000,
      region: 'us-ca',
      providerName: 'MoonPay',
      checkoutUrl: 'https://provider.example/buy',
      hasCallbackFlow: true,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.properties).toMatchObject({
      has_callback_flow: true,
    });
  });

  it('tracks callback detected with sanitized url path', () => {
    trackRampsCheckoutCallbackDetected(
      context,
      'https://provider.example/callback?wallet=0xabc',
      2,
    );

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsCheckoutCallbackDetected);
    expect(built.properties).toMatchObject({
      checkout_session_id: 'session-1',
      url_path: '/callback',
      step_index: 2,
      time_since_open_ms: 1_500,
      region: 'us-ca',
      provider_name: 'Transak',
      order_id: 'order-abc',
    });
  });

  it('tracks checkout closed on user tab close', () => {
    trackRampsCheckoutClosed(context, {
      closeSource: 'user_close_button',
      callbackReached: false,
      stepIndex: 3,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsCheckoutClosed);
    expect(built.properties).toMatchObject({
      close_source: 'user_close_button',
      callback_reached: false,
      step_index: 3,
      time_on_screen_ms: 1_500,
      order_id: 'order-abc',
      provider_name: 'Transak',
    });
  });
});
