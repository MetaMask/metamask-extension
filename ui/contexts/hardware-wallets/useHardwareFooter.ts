import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCorrectDeveloperTransactionType } from '../../../shared/lib/confirmation.utils';
import { isFirefoxBrowser } from '../../../shared/lib/browser-runtime.utils';
import { isSignatureTransactionType } from '../../pages/confirmations/utils';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from './HardwareWalletContext';
import { useHardwareWalletError } from './HardwareWalletErrorProvider';
import {
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
} from './rpcErrorUtils';
import {
  ConnectionStatus,
  HardwareWalletType,
  type EnsureDeviceReadyOptions,
} from './types';
import { useHardwareWalletMetrics } from './useHardwareWalletMetrics';

type UseHardwareFooterArgs = {
  currentConfirmation?: TransactionMeta;
  currentConfirmationId?: string;
  onUserRejectedHardwareWalletError: () => Promise<void>;
};

/**
 * Returns true when the transport is established (`Connected`) or when a full
 * readiness probe has succeeded (`Ready`). `Connected` alone is enough to show
 * the primary "Confirm" CTA: `ensureDeviceReady` still runs on submit before signing.
 *
 * @param status - Current `ConnectionStatus` from hardware wallet context.
 */
export function isHardwareConnectionReadyForConfirmFooter(
  status: ConnectionStatus,
): boolean {
  return (
    status === ConnectionStatus.Ready || status === ConnectionStatus.Connected
  );
}

export type SubmitPreflightCheckOptions = {
  /**
   * When true, runs hardware-wallet Connect-CTA metrics before device readiness (e.g. dedicated “Connect device” button).
   * Omit or set to false for preflight from the main Confirm action.
   */
  trackConnectCta?: boolean;
};

type UseHardwareFooterResult = {
  walletType: ReturnType<typeof useHardwareWalletConfig>['walletType'];
  shouldRunHardwareWalletPreflight: boolean;
  isHardwareWalletReady: boolean;
  onSubmitPreflightCheck: (
    options?: SubmitPreflightCheckOptions,
  ) => Promise<boolean>;
  withHardwareWalletModalHandling: (
    request: () => Promise<void>,
  ) => () => Promise<void>;
};

export const useHardwareFooter = ({
  currentConfirmation,
  currentConfirmationId,
  onUserRejectedHardwareWalletError,
}: UseHardwareFooterArgs): UseHardwareFooterResult => {
  const { trackConnectCtaClicked } = useHardwareWalletMetrics();
  const { connectionState } = useHardwareWalletState();
  const { isHardwareWalletAccount, walletType } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const { showErrorModal } = useHardwareWalletError();
  const [hasPreflightSucceeded, setHasPreflightSucceeded] = useState(false);

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );

  const shouldRunHardwareWalletPreflight =
    isHardwareWalletAccount && (isSignature || isTransactionConfirmation);

  // Simple sends (plain native asset transfers) don't require blind signing
  // on the Ledger device since they don't involve contract interactions.
  const ensureDeviceReadyOptions = useMemo<EnsureDeviceReadyOptions>(
    () => ({
      requireBlindSigning:
        currentConfirmation?.type !== TransactionType.simpleSend,
    }),
    [currentConfirmation?.type],
  );

  useEffect(() => {
    if (!isHardwareWalletAccount) {
      setHasPreflightSucceeded(false);
      return;
    }

    if (
      connectionState.status === ConnectionStatus.Disconnected ||
      connectionState.status === ConnectionStatus.ErrorState
    ) {
      setHasPreflightSucceeded(false);
    }
  }, [connectionState.status, isHardwareWalletAccount]);

  useEffect(() => {
    setHasPreflightSucceeded(false);
  }, [currentConfirmationId]);

  const isHardwareWalletReady = useMemo(() => {
    if (!isHardwareWalletAccount || hasPreflightSucceeded) {
      return true;
    }

    // QR wallets don't need a physical device connection before showing the
    // primary footer CTA. The Confirm action still runs ensureDeviceReady,
    // which handles camera permission before signing.
    if (walletType === HardwareWalletType.Qr) {
      return true;
    }

    // Trezor on Firefox uses a different connection flow and does not require
    // the "Connect Trezor" preflight step before the Confirm CTA.
    // ensureDeviceReady still runs on submit to establish the session.
    if (walletType === HardwareWalletType.Trezor && isFirefoxBrowser()) {
      return true;
    }

    return isHardwareConnectionReadyForConfirmFooter(connectionState.status);
  }, [
    connectionState.status,
    hasPreflightSucceeded,
    isHardwareWalletAccount,
    walletType,
  ]);

  const onSubmitPreflightCheck = useCallback(
    async (options?: SubmitPreflightCheckOptions): Promise<boolean> => {
      if (!isHardwareWalletAccount) {
        return true;
      }

      if (options?.trackConnectCta) {
        trackConnectCtaClicked();
      }

      const isDeviceReady = await ensureDeviceReady(ensureDeviceReadyOptions);
      setHasPreflightSucceeded(isDeviceReady);

      return isDeviceReady;
    },
    [
      isHardwareWalletAccount,
      trackConnectCtaClicked,
      ensureDeviceReady,
      ensureDeviceReadyOptions,
    ],
  );

  const withHardwareWalletModalHandling = useCallback(
    (request: () => Promise<void>) => {
      return async () => {
        try {
          await request();
        } catch (error) {
          if (!isHardwareWalletError(error)) {
            throw error;
          }

          if (isUserRejectedHardwareWalletError(error)) {
            await onUserRejectedHardwareWalletError();
            return;
          }

          showErrorModal(error);
        }
      };
    },
    [onUserRejectedHardwareWalletError, showErrorModal],
  );

  return {
    walletType,
    shouldRunHardwareWalletPreflight,
    isHardwareWalletReady,
    onSubmitPreflightCheck,
    withHardwareWalletModalHandling,
  };
};
