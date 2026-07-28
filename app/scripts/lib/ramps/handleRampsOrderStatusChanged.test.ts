import type { RampsOrder } from '@metamask/ramps-controller';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { handleRampsOrderStatusChanged } from './handleRampsOrderStatusChanged';

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
  const trackEvent = jest.fn();
  const analytics = { trackEvent, createEventBuilder };

  beforeEach(() => trackEvent.mockClear());

  it('tracks Ramps Transaction Completed on COMPLETED', () => {
    handleRampsOrderStatusChanged(makeEvent('COMPLETED'), analytics);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent.mock.calls[0][0].name).toBe(
      MetaMetricsEventName.RampsTransactionCompleted,
    );
  });

  it.each(['FAILED', 'ID_EXPIRED'])('tracks failed on %s', (status) => {
    handleRampsOrderStatusChanged(makeEvent(status), analytics);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const built = trackEvent.mock.calls[0][0];
    expect(built.name).toBe(MetaMetricsEventName.RampsTransactionFailed);
    expect(built.properties.error_message).toBe('card_declined');
  });

  it.each(['PENDING', 'CREATED', 'CANCELLED', 'UNKNOWN'])(
    'does not track for non-terminal/deferred status %s',
    (status) => {
      handleRampsOrderStatusChanged(makeEvent(status), analytics);
      expect(trackEvent).not.toHaveBeenCalled();
    },
  );
});
