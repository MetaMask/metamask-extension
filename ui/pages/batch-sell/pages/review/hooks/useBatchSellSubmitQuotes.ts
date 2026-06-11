import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { captureException } from '../../../../../../shared/lib/sentry';
import { submitBatchSellTrade } from '../../../../../ducks/bridge-status/actions';
import {
  getFromAccount,
  getIsStxEnabled,
} from '../../../../../ducks/bridge/selectors';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import type { MetaMaskReduxDispatch } from '../../../../../store/store';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';

type UseBatchSellSubmitQuotesArgs = {
  quoteResponses: ((QuoteResponse & QuoteMetadata) | null)[];
  receivedAsset: BatchSellAsset;
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
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const fromAccount = useSelector(getFromAccount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBatchSellQuotes = async () => {
    if (!fromAccount) {
      return;
    }

    setIsSubmitting(true);

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
