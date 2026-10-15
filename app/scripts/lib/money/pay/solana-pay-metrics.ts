/* eslint-disable @typescript-eslint/naming-convention */
import type { SolanaPayLifecyclePayload } from '@metamask/transaction-pay-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../../controllers/analytics';

/**
 * Tracks a privacy-safe durable Solana Pay lifecycle transition.
 *
 * The standard Extension event pipeline supplies the same analytics identity
 * used by EVM MetaMask Pay. Core deliberately excludes accounts, assets,
 * amounts, provider request identifiers, transaction identifiers, payloads,
 * and free-form error text from this Solana-only lifecycle projection. Keep
 * the mapping explicit so those values cannot be added by spreading
 * transaction metadata into analytics.
 *
 * @param payload - Core's privacy-safe lifecycle projection.
 */
export function trackSolanaPayLifecycle(
  payload: SolanaPayLifecyclePayload,
): void {
  trackEvent(
    createEventBuilder(MetaMetricsEventName.MetaMaskPaySolanaLifecycle)
      .addCategory(MetaMetricsEventCategory.Transactions)
      .addProperties({
        ...(payload.errorCode && {
          mm_pay_error_code: payload.errorCode,
        }),
        mm_pay_follow_up_status: payload.followUpStatus,
        mm_pay_follow_up_transaction_id_present:
          payload.followUpTransactionIdPresent,
        mm_pay_is_recovery: payload.isRecovery,
        mm_pay_notification_status: payload.notificationStatus,
        mm_pay_outcome: payload.outcome,
        mm_pay_phase: payload.phase,
        mm_pay_provider: payload.provider,
        mm_pay_relay_status: payload.relayStatus,
        mm_pay_request_id_present: payload.requestIdPresent,
        mm_pay_source_asset_class: payload.sourceAssetClass,
        mm_pay_source_status: payload.sourceStatus,
        mm_pay_source_transaction_id_present:
          payload.sourceTransactionIdPresent,
        mm_pay_target_transaction_id_present:
          payload.targetTransactionIdPresent,
      })
      .build(),
  );
}
