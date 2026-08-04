import type { RampsOrder } from '@metamask/ramps-controller';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import {
  handleRampsOrderStatusChanged,
  trackRampsTerminalOrder,
  trackRampsTransactionConfirmed,
} from './handleRampsOrderStatusChanged';
import { isRampsAnalyticsEnabled } from './isRampsAnalyticsEnabled';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

jest.mock('./isRampsAnalyticsEnabled', () => ({
  isRampsAnalyticsEnabled: jest.fn().mockReturnValue(true),
}));

function makeEvent(status: string) {
  return {
    order: {
      status,
      fiatAmount: 100,
      cryptoAmount: 0.02,
      totalFeesFiat: 4,
      statusDescription: 'card_declined',
    } as unknown as RampsOrder,
    previousStatus: 'PENDING' as unknown as RampsOrder['status'],
  };
}

describe('handleRampsOrderStatusChanged', () => {
  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(true);
  });

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
    } as unknown as RampsOrder;

    trackRampsTerminalOrder(order);
    handleRampsOrderStatusChanged({
      order,
      previousStatus: 'PENDING' as unknown as RampsOrder['status'],
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('emits for both orders when two distinct orders share an order code', () => {
    const shared = { status: 'COMPLETED', providerOrderId: 'same-code' };

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

  it('does not emit terminal KPI when the ramps flag is off', () => {
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(false);

    handleRampsOrderStatusChanged(makeEvent('COMPLETED'));

    expect(trackEvent).not.toHaveBeenCalled();
  });
});

describe('trackRampsTransactionConfirmed', () => {
  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(true);
  });

  it('tracks Ramps Transaction Confirmed for a non-terminal PENDING order', () => {
    trackRampsTransactionConfirmed({
      status: 'PENDING',
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
    } as unknown as RampsOrder);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(trackEvent).mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsTransactionConfirmed,
    );
  });

  it('does not track for terminal status COMPLETED', () => {
    trackRampsTransactionConfirmed({
      status: 'COMPLETED',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status FAILED', () => {
    trackRampsTransactionConfirmed({
      status: 'FAILED',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status CANCELLED', () => {
    trackRampsTransactionConfirmed({
      status: 'CANCELLED',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track for terminal status ID_EXPIRED', () => {
    trackRampsTransactionConfirmed({
      status: 'ID_EXPIRED',
    } as unknown as RampsOrder);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not track when no order is provided', () => {
    trackRampsTransactionConfirmed(undefined);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('passes region through to the confirmed properties', () => {
    trackRampsTransactionConfirmed(
      {
        status: 'PENDING',
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

  it('does not emit confirmed KPI when the ramps flag is off', () => {
    jest.mocked(isRampsAnalyticsEnabled).mockReturnValue(false);

    trackRampsTransactionConfirmed({
      status: 'PENDING',
    } as unknown as RampsOrder);

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
