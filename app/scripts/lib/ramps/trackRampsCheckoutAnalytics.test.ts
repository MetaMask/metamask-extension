/* eslint-disable @typescript-eslint/naming-convention */
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import { isRampsAnalyticsEnabled } from './isRampsAnalyticsEnabled';
import {
  trackRampsCheckoutCallbackDetected,
  trackRampsCheckoutClosed,
} from './trackRampsCheckoutAnalytics';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

jest.mock('./isRampsAnalyticsEnabled', () => ({
  isRampsAnalyticsEnabled: jest.fn().mockReturnValue(true),
}));

describe('trackRampsCheckoutAnalytics', () => {
  const context = {
    checkoutSessionId: 'session-1',
    checkoutOpenedAt: 1_000,
    region: 'us-ca',
    orderCode: 'order-abc',
  };

  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(true);
    jest.spyOn(Date, 'now').mockReturnValue(2_500);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    });
  });

  it('does not track when the ramps flag is off', () => {
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(false);

    trackRampsCheckoutCallbackDetected(context, 'https://provider.example/cb', 1);
    trackRampsCheckoutClosed(context, {
      closeSource: 'user_close_button',
      callbackReached: false,
      stepIndex: 1,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
