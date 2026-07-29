import type { RampsOrder } from '@metamask/ramps-controller';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { trackEvent } from '../../controllers/analytics';
import { handleRampsOrderStatusChanged } from './handleRampsOrderStatusChanged';

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
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
});
