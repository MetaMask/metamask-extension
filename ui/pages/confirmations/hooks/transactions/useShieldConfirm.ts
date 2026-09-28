import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  type ModalType,
} from '@metamask/subscription-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TRANSACTION_SHIELD_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../../helpers/constants/routes';
import { getModalTypeForShieldEntryModal } from '../../../../selectors';
import {
  getLastUsedShieldSubscriptionPaymentDetails,
  getUserSubscriptions,
} from '../../../../selectors/subscription';
import { useSubscriptionMetrics } from '../../../../hooks/shield/metrics/useSubscriptionMetrics';
import { CaptureShieldCryptoConfirmationEventParams } from '../../../../hooks/shield/metrics/types';
import {
  ShieldMetricsSourceEnum,
  ShieldSubscriptionRequestSubscriptionStateEnum,
} from '../../../../../shared/constants/subscriptions';

/**
 * Handlers for shield subscription approval transaction after confirm in UI
 *
 * @returns
 */
export const useShieldConfirm = () => {
  const navigate = useNavigate();
  const { captureShieldCryptoConfirmationEvent } = useSubscriptionMetrics();
  const lastSelectedPaymentDetails = useSelector(
    getLastUsedShieldSubscriptionPaymentDetails,
  );
  const { trialedProducts, lastSubscription } =
    useSelector(getUserSubscriptions);
  const modalType = useSelector(getModalTypeForShieldEntryModal) as ModalType;
  const getCryptoConfirmationEventParams = useCallback(
    (
      txMeta: TransactionMeta,
      confirmationScreenStatus: CaptureShieldCryptoConfirmationEventParams['confirmationScreenStatus'],
      hasInsufficientGas: boolean,
    ): CaptureShieldCryptoConfirmationEventParams => {
      const billingInterval =
        lastSelectedPaymentDetails?.plan ?? RECURRING_INTERVALS.month;
      const gasSponsored = Boolean(txMeta.isGasFeeSponsored);

      return {
        defaultBillingInterval: RECURRING_INTERVALS.year,
        defaultPaymentType: PAYMENT_TYPES.byCrypto,
        defaultPaymentCurrency: 'USD',
        defaultPaymentChain: txMeta.chainId,
        source: ShieldMetricsSourceEnum.ShieldSettings,
        type: modalType,
        subscriptionState: lastSubscription
          ? ShieldSubscriptionRequestSubscriptionStateEnum.Renew
          : ShieldSubscriptionRequestSubscriptionStateEnum.New,
        paymentType: PAYMENT_TYPES.byCrypto,
        paymentCurrency:
          lastSelectedPaymentDetails?.paymentTokenSymbol ?? 'USD',
        isTrialSubscription: !trialedProducts?.includes(PRODUCT_TYPES.SHIELD),
        billingInterval,
        paymentChain: txMeta.chainId,
        hasSufficientCryptoBalance: undefined,
        gasSponsored,
        confirmationScreenStatus,
        hasInsufficientGas,
      };
    },
    [lastSelectedPaymentDetails, lastSubscription, modalType, trialedProducts],
  );

  /**
   * Handle shield subscription approval transaction after confirm in UI
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirm = useCallback(
    (txMeta: TransactionMeta) => {
      if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      navigate(`${TRANSACTION_SHIELD_ROUTE}?waitForSubscriptionCreation=true`);
    },
    [navigate],
  );

  /**
   * Handle shield subscription approval transaction approval error
   * (navigation)
   *
   * @param txMeta - The transaction meta
   */
  const handleShieldSubscriptionApprovalTransactionAfterConfirmErr =
    useCallback(
      (txMeta: TransactionMeta) => {
        if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
          return;
        }

        // go back to previous screen from navigate in `handleShieldSubscriptionApprovalTransactionAfterConfirm`
        navigate(PREVIOUS_ROUTE);
      },
      [navigate],
    );

  /**
   * Track when the Shield subscription approval confirmation screen opens.
   *
   * @param txMeta - The transaction metadata.
   */
  const handleShieldSubscriptionApprovalTransactionOpened = useCallback(
    (txMeta: TransactionMeta, hasInsufficientGas = false) => {
      if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      captureShieldCryptoConfirmationEvent(
        getCryptoConfirmationEventParams(txMeta, 'opened', hasInsufficientGas),
      );
    },
    [captureShieldCryptoConfirmationEvent, getCryptoConfirmationEventParams],
  );

  /**
   * Track when the user rejects a Shield subscription approval from the
   * confirmation screen.
   *
   * @param txMeta - The transaction metadata.
   */
  const handleShieldSubscriptionApprovalTransactionRejected = useCallback(
    (txMeta: TransactionMeta, hasInsufficientGas = false) => {
      if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
        return;
      }

      captureShieldCryptoConfirmationEvent(
        getCryptoConfirmationEventParams(
          txMeta,
          'rejected',
          hasInsufficientGas,
        ),
      );
    },
    [captureShieldCryptoConfirmationEvent, getCryptoConfirmationEventParams],
  );

  return {
    handleShieldSubscriptionApprovalTransactionAfterConfirm,
    handleShieldSubscriptionApprovalTransactionAfterConfirmErr,
    handleShieldSubscriptionApprovalTransactionOpened,
    handleShieldSubscriptionApprovalTransactionRejected,
  };
};
