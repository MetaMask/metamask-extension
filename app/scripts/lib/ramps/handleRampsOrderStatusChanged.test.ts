/* eslint-disable @typescript-eslint/naming-convention */
import type { RampsOrder } from '@metamask/ramps-controller';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import {
  handleRampsOrderStatusChanged,
  trackRampsTerminalOrder,
  trackRampsTransactionConfirmed,
} from './handleRampsOrderStatusChanged';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

function makeEvent(status: string) {
  return {
    order: {
      status,
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
      statusDescription: 'card_declined',
    } as unknown as RampsOrder,
    previousStatus: 'PENDING' as unknown as RampsOrder['status'],
  };
}

describe('handleRampsOrderStatusChanged', () => {
  beforeEach(() => jest.mocked(trackEvent).mockClear());

  it('tracks Ramps Transaction Completed on COMPLETED', () => {
    handleRampsOrderStatusChanged(makeEvent('COMPLETED'));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsTransactionCompleted,
    );
  });

  it('tracks failed on FAILED', () => {
    handleRampsOrderStatusChanged(makeEvent('FAILED'));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsTransactionFailed);
    expect(built.properties.error_message).toBe('card_declined');
  });

  it('tracks failed on ID_EXPIRED', () => {
    handleRampsOrderStatusChanged(makeEvent('ID_EXPIRED'));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = jest.mocked(trackEvent).mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsTransactionFailed);
    expect(built.properties.error_message).toBe('card_declined');
  });

  it('does not track for non-terminal status PENDING', () => {
    handleRampsOrderStatusChanged(makeEvent('PENDING'));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for non-terminal status CREATED', () => {
    handleRampsOrderStatusChanged(makeEvent('CREATED'));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for deferred status CANCELLED', () => {
    handleRampsOrderStatusChanged(makeEvent('CANCELLED'));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for non-terminal status UNKNOWN', () => {
    handleRampsOrderStatusChanged(makeEvent('UNKNOWN'));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('emits once per order across the callback and polling paths', () => {
    const order = {
      id: '/providers/moonpay/orders/order-1',
      providerOrderId: 'order-1',
      status: 'COMPLETED',
      orderType: 'BUY',
    } as unknown as RampsOrder;

    trackRampsTerminalOrder(order);
    handleRampsOrderStatusChanged({
      order,
      previousStatus: 'PENDING' as unknown as RampsOrder['status'],
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('does not track a SELL order — those are not part of the unified buy funnel', () => {
    handleRampsOrderStatusChanged({
      order: {
        status: 'COMPLETED',
        orderType: 'SELL',
      } as unknown as RampsOrder,
      previousStatus: 'PENDING' as unknown as RampsOrder['status'],
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tracks a DEPOSIT order — deposits are a buy variant', () => {
    handleRampsOrderStatusChanged({
      order: {
        status: 'COMPLETED',
        orderType: 'DEPOSIT',
      } as unknown as RampsOrder,
      previousStatus: 'PENDING' as unknown as RampsOrder['status'],
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('tracks a lowercase `buy` orderType from a locally-created order', () => {
    handleRampsOrderStatusChanged({
      order: {
        status: 'COMPLETED',
        orderType: 'buy',
      } as unknown as RampsOrder,
      previousStatus: 'PENDING' as unknown as RampsOrder['status'],
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('emits for both orders when two distinct orders share an order code', () => {
    const shared = {
      status: 'COMPLETED',
      orderType: 'BUY',
      providerOrderId: 'same-code',
    };

    trackRampsTerminalOrder({
      ...shared,
      id: '/providers/moonpay/orders/same-code',
    } as unknown as RampsOrder);
    trackRampsTerminalOrder({
      ...shared,
      id: '/providers/transak/orders/same-code',
    } as unknown as RampsOrder);

    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});

describe('trackRampsTransactionConfirmed', () => {
  beforeEach(() => jest.mocked(trackEvent).mockClear());

  it('tracks Ramps Transaction Confirmed for a non-terminal PENDING order', () => {
    trackRampsTransactionConfirmed({
      status: 'PENDING',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    } as unknown as RampsOrder);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsTransactionConfirmed,
    );
  });

  it('tracks Ramps Transaction Confirmed for a CREATED order', () => {
    trackRampsTransactionConfirmed({
      status: 'CREATED',
      orderType: 'BUY',
    } as unknown as RampsOrder);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsTransactionConfirmed,
    );
  });

  it('does not track for terminal status COMPLETED', () => {
    trackRampsTransactionConfirmed({
      status: 'COMPLETED',
      orderType: 'BUY',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status FAILED', () => {
    trackRampsTransactionConfirmed({
      status: 'FAILED',
      orderType: 'BUY',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status CANCELLED', () => {
    trackRampsTransactionConfirmed({
      status: 'CANCELLED',
      orderType: 'BUY',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status ID_EXPIRED', () => {
    trackRampsTransactionConfirmed({
      status: 'ID_EXPIRED',
      orderType: 'BUY',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track when no order is provided', () => {
    trackRampsTransactionConfirmed(undefined);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track a SELL order', () => {
    trackRampsTransactionConfirmed({
      status: 'PENDING',
      orderType: 'SELL',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('passes region through to the confirmed properties', () => {
    trackRampsTransactionConfirmed(
      {
        status: 'PENDING',
        orderType: 'BUY',
        fiatAmount: 100,
        cryptoAmount: 0.02,
        totalFeesFiat: 4,
        region: 'us-ca',
      } as unknown as RampsOrder,
      'fr',
    );
    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      region: 'fr',
      country: 'fr',
    });
  });
});

describe('checkout_session_id threading', () => {
  beforeEach(() => jest.mocked(trackEvent).mockClear());

  it('passes checkoutSessionId to the completed properties on the callback path', () => {
    trackRampsTerminalOrder(
      {
        id: '/providers/moonpay/orders/session-completed',
        providerOrderId: 'session-completed',
        status: 'COMPLETED',
        orderType: 'BUY',
        fiatAmount: 100,
        cryptoAmount: 0.02,
        totalFeesFiat: 4,
      } as unknown as RampsOrder,
      'session-abc',
    );

    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      checkout_session_id: 'session-abc',
    });
  });

  it('passes checkoutSessionId to the confirmed properties on the callback path', () => {
    trackRampsTransactionConfirmed(
      {
        id: '/providers/moonpay/orders/session-confirmed',
        providerOrderId: 'session-confirmed',
        status: 'PENDING',
        orderType: 'BUY',
        fiatAmount: 100,
        cryptoAmount: 0.02,
        totalFeesFiat: 4,
      } as unknown as RampsOrder,
      'us-ca',
      'session-abc',
    );

    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      checkout_session_id: 'session-abc',
    });
  });

  it('passes checkoutSessionId to the failed properties on the callback path', () => {
    trackRampsTerminalOrder(
      {
        id: '/providers/moonpay/orders/session-failed',
        providerOrderId: 'session-failed',
        status: 'FAILED',
        orderType: 'BUY',
        fiatAmount: 100,
        cryptoAmount: 0.02,
        totalFeesFiat: 4,
        statusDescription: 'card_declined',
      } as unknown as RampsOrder,
      'session-abc',
    );

    expect(jest.mocked(trackEvent).mock.calls[0][0].properties).toMatchObject({
      checkout_session_id: 'session-abc',
    });
  });

  it('looks up checkout_session_id from the map on the polling path', () => {
    const order = {
      id: '/providers/moonpay/orders/session-poll',
      providerOrderId: 'session-poll',
      status: 'PENDING',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    } as unknown as RampsOrder;

    // Callback path: confirmed records the session id for this order key.
    trackRampsTransactionConfirmed(order, 'us-ca', 'session-poll');

    // Polling path: terminal fires with no session id arg — should find it
    // in the map.
    trackRampsTerminalOrder({
      ...order,
      status: 'COMPLETED',
      orderType: 'BUY',
    } as unknown as RampsOrder);

    const terminalCall = jest.mocked(trackEvent).mock.calls[1][0];
    expect(terminalCall.name).toBe(
      MetaMetricsEventName.RampsTransactionCompleted,
    );
    expect(terminalCall.properties).toMatchObject({
      checkout_session_id: 'session-poll',
    });
  });

  it('omits checkout_session_id when no session id was recorded for the order', () => {
    trackRampsTerminalOrder({
      id: '/providers/moonpay/orders/no-session-test',
      providerOrderId: 'no-session-test',
      status: 'COMPLETED',
      orderType: 'BUY',
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
    } as unknown as RampsOrder);

    expect(
      jest.mocked(trackEvent).mock.calls[0][0].properties,
    ).not.toHaveProperty('checkout_session_id');
  });
});
