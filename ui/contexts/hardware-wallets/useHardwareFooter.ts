import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCorrectDeveloperTransactionType } from '../../../shared/lib/confirmation.utils';
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
import { ConnectionStatus, type EnsureDeviceReadyOptions } from './types';

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
  const inE2e =
    process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
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
    !inE2e &&
    isHardwareWalletAccount &&
    (isSignature || isTransactionConfirmation);

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
    if (inE2e) {
      return;
    }

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
  }, [connectionState.status, inE2e, isHardwareWalletAccount]);

  useEffect(() => {
    if (inE2e) {
      return;
    }

    setHasPreflightSucceeded(false);
  }, [currentConfirmationId, inE2e]);

  const isHardwareWalletReady = useMemo(() => {
    if (inE2e) {
      return true;
    }

    if (!isHardwareWalletAccount) {
      return true;
    }

    if (hasPreflightSucceeded) {
      return true;
    }

    return [ConnectionStatus.Ready].includes(connectionState.status);
  }, [
    connectionState.status,
    hasPreflightSucceeded,
    inE2e,
    isHardwareWalletAccount,
  ]);

  const onSubmitPreflightCheck = useCallback(async (): Promise<boolean> => {
    if (inE2e || !isHardwareWalletAccount) {
      return true;
    }

    const isDeviceReady = await ensureDeviceReady(ensureDeviceReadyOptions);
    setHasPreflightSucceeded(isDeviceReady);

    if (!isDeviceReady) {
      return false;
    }

    return true;
  }, [
    inE2e,
    isHardwareWalletAccount,
    ensureDeviceReady,
    ensureDeviceReadyOptions,
  ]);

  const withHardwareWalletModalHandling = useCallback(
    (request: () => Promise<void>) => {
      return async () => {
        if (inE2e) {
          await request();
          return;
        }

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
    [inE2e, onUserRejectedHardwareWalletError, showErrorModal],
  );

  return {
    walletType,
    shouldRunHardwareWalletPreflight,
    isHardwareWalletReady,
    onSubmitPreflightCheck,
    withHardwareWalletModalHandling,
  };
};
