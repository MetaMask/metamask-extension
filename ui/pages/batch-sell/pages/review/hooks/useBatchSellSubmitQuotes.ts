import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { isHardwareWallet } from '../../../../../../shared/lib/selectors/keyring';
import { captureException } from '../../../../../../shared/lib/sentry';
import { submitBatchSellTrade } from '../../../../../ducks/bridge-status/actions';
import { setWasTxDeclined } from '../../../../../ducks/bridge/actions';
import {
  getFromAccount,
  getIsStxEnabled,
} from '../../../../../ducks/bridge/selectors';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../../../contexts/hardware-wallets/HardwareWalletContext';
import { useBridgeNavigation } from '../../../../../hooks/bridge/useBridgeNavigation';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import type { MetaMaskReduxDispatch } from '../../../../../store/store';
// eslint-disable-next-line import-x/no-restricted-paths
import { isHardwareWalletUserRejection } from '../../../../bridge/utils/hardware-wallet-errors';
import type { ReceivedAsset } from '../types';

type UseBatchSellSubmitQuotesArgs = {
  quoteResponses: ((QuoteResponse & QuoteMetadata) | null)[];
  receivedAsset: ReceivedAsset;
};

/**
 * Submits a batch-sell trade through the bridge status controller.
 *
 * Mirrors `useSubmitBridgeTransaction`, but forwards the full list of
 * recommended quotes (one per send asset slot) to the new `submitBatchSell`
 * controller method instead of a single quote.
 *
 * @param args - Hook arguments.
 * @param args.quoteResponses - Recommended quote per send slot. Pass the
 * `recommendedQuotes` array straight from `getBatchSellQuotes`.
 * @param args.receivedAsset - The selected destination asset. Used to surface
 * the destination security classification to analytics.
 */
export default function useBatchSellSubmitQuotes({
  quoteResponses,
  receivedAsset,
}: UseBatchSellSubmitQuotesArgs) {
  const navigate = useNavigate();
  const { navigateToBridgePage, navigateToHwSigningPage } =
    useBridgeNavigation();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const fromAccount = useSelector(getFromAccount);
  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBatchSellQuotes = async () => {
    setIsSubmitting(true);

    try {
      if (isHardwareWalletAccount) {
        const isDeviceReady = await ensureDeviceReady();
        if (!isDeviceReady) {
          throw new Error('Hardware wallet device is not ready');
        }
      }

      if (!fromAccount) {
        throw new Error(
          'Failed to submit batch-sell transaction: No selected account',
        );
      }
    } catch {
      setIsSubmitting(false);
      return;
    }

    if (hardwareWalletUsed) {
      navigateToHwSigningPage();
      setIsSubmitting(false);
    }

    try {
      await dispatch(
        submitBatchSellTrade({
          quoteResponses,
          accountAddress: fromAccount.address,
          isStxEnabled: smartTransactionsEnabled,
          tokenSecurityTypeDestination:
            receivedAsset?.securityData?.type ?? null,
        }),
      );
    } catch (e) {
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        navigateToBridgePage();
        return;
      }
    } finally {
      setIsSubmitting(false);
    }

    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      state: { stayOnHomePage: true },
      replace: true,
    });
  };

  return {
    submitBatchSellQuotes,
    isSubmitting,
  };
}
