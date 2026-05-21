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

    return ConnectionStatus.Ready === connectionState.status;
  }, [connectionState.status, hasPreflightSucceeded, isHardwareWalletAccount]);

  const onSubmitPreflightCheck = useCallback(async (): Promise<boolean> => {
    if (!isHardwareWalletAccount) {
      return true;
    }

    const isDeviceReady = await ensureDeviceReady(ensureDeviceReadyOptions);
    setHasPreflightSucceeded(isDeviceReady);

    return isDeviceReady;
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
