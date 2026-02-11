import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { isSignatureTransactionType } from '../../../utils';
import {
  ConnectionStatus,
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletError,
  useHardwareWalletState,
  type EnsureDeviceReadyOptions,
} from '../../../../../contexts/hardware-wallets';

type UseHardwareFooterArgs = {
  currentConfirmation?: TransactionMeta;
  currentConfirmationId?: string;
  onUserRejectedHardwareWalletError: () => Promise<void>;
};

type UseHardwareFooterResult = {
  walletType: ReturnType<typeof useHardwareWalletConfig>['walletType'];
  shouldRunHardwareWalletPreflight: boolean;
  isHardwareWalletReady: boolean;
  onSubmitPreflightCheck: () => Promise<boolean>;
  withHardwareWalletModalHandling: (
    request: () => Promise<void>,
  ) => () => Promise<void>;
};

export const useHardwareFooter = ({
  currentConfirmation,
  currentConfirmationId,
  onUserRejectedHardwareWalletError,
}: UseHardwareFooterArgs): UseHardwareFooterResult => {
  const { connectionState } = useHardwareWalletState();
  const { isHardwareWalletAccount, walletType } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const { showErrorModal } = useHardwareWalletError();
  const [hasPreflightSucceeded, setHasPreflightSucceeded] = useState(false);

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );

  const inE2e =
    process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
  if (inE2e) {
    return {
      walletType,
      shouldRunHardwareWalletPreflight: false,
      isHardwareWalletReady: true,
      onSubmitPreflightCheck: async () => true,
      withHardwareWalletModalHandling: (request: () => Promise<void>) =>
        request,
    };
  }

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
    if (!isHardwareWalletAccount) {
      return true;
    }

    if (hasPreflightSucceeded) {
      return true;
    }

    return [ConnectionStatus.Connected, ConnectionStatus.Ready].includes(
      connectionState.status,
    );
  }, [connectionState.status, hasPreflightSucceeded, isHardwareWalletAccount]);

  const onSubmitPreflightCheck = useCallback(async (): Promise<boolean> => {
    if (!isHardwareWalletAccount) {
      return true;
    }

    const isDeviceReady = await ensureDeviceReady(ensureDeviceReadyOptions);
    setHasPreflightSucceeded(isDeviceReady);

    if (!isDeviceReady) {
      return false;
    }

    return true;
  }, [isHardwareWalletAccount, ensureDeviceReady, ensureDeviceReadyOptions]);

  const withHardwareWalletModalHandling = useCallback(
    (request: () => Promise<void>) => {
      return async () => {
        try {
          await request();
        } catch (error) {
          // Use isHardwareWalletError which handles duck typing for errors
          // that lost their class type over the RPC boundary
          if (!isHardwareWalletError(error)) {
            // Non-hardware wallet error - rethrow
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
