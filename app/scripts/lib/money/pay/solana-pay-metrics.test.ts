/* eslint-disable @typescript-eslint/naming-convention */
import type { SolanaPayLifecyclePayload } from '@metamask/transaction-pay-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { trackEvent } from '../../../controllers/analytics';
import { trackSolanaPayLifecycle } from './solana-pay-metrics';

jest.mock('../../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

describe('trackSolanaPayLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks the privacy-safe Core lifecycle projection', () => {
    const payload: SolanaPayLifecyclePayload = {
      errorCode: 'settlement_status_unknown',
      followUpStatus: 'not-required',
      followUpTransactionIdPresent: false,
      isRecovery: true,
      notificationStatus: 'failure',
      outcome: 'unknown',
      phase: 'unknown',
      provider: 'relay',
      relayStatus: 'unknown',
      requestIdPresent: true,
      sourceAssetClass: 'native',
      sourceStatus: 'confirmed',
      sourceTransactionIdPresent: true,
      targetTransactionIdPresent: false,
    };

    trackSolanaPayLifecycle(payload);

    expect(trackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.MetaMaskPaySolanaLifecycle,
      properties: {
        category: MetaMetricsEventCategory.Transactions,
        mm_pay_error_code: payload.errorCode,
        mm_pay_follow_up_status: 'not-required',
        mm_pay_follow_up_transaction_id_present: false,
        mm_pay_is_recovery: true,
        mm_pay_notification_status: 'failure',
        mm_pay_outcome: 'unknown',
        mm_pay_phase: 'unknown',
        mm_pay_provider: 'relay',
        mm_pay_relay_status: 'unknown',
        mm_pay_request_id_present: true,
        mm_pay_source_asset_class: 'native',
        mm_pay_source_status: 'confirmed',
        mm_pay_source_transaction_id_present: true,
        mm_pay_target_transaction_id_present: false,
      },
      sensitiveProperties: {},
    });
  });

  it('omits an unavailable error classification', () => {
    trackSolanaPayLifecycle({
      followUpStatus: 'not-required',
      followUpTransactionIdPresent: false,
      isRecovery: false,
      notificationStatus: 'not-ready',
      outcome: 'ready',
      phase: 'ready',
      provider: 'relay',
      relayStatus: 'not-observed',
      requestIdPresent: true,
      sourceAssetClass: 'token',
      sourceStatus: 'not-observed',
      sourceTransactionIdPresent: false,
      targetTransactionIdPresent: false,
    });

    const event = jest.mocked(trackEvent).mock.calls[0][0];
    expect(event.properties).not.toHaveProperty('mm_pay_error_code');
    expect(event.properties).not.toHaveProperty('mm_pay_analytics_id');
    expect(event.sensitiveProperties).toStrictEqual({});
  });
});
