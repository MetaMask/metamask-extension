import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button } from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getToChain,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitBridgeTransaction } from '../../../ducks/bridge/actions';
import useBridgeQuotes from '../../../hooks/bridge/useBridgeQuotes';
import { getGasFeeEstimates } from '../../../ducks/metamask/metamask';
import { decGWEIToHexWEI } from '../../../../shared/modules/conversion.utils';

export const BridgeCTAButton = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const { recommendedQuote } = useBridgeQuotes();

  const { isLoading } = useSelector(getBridgeQuotes);

  const gasFeeEstimates = useSelector(getGasFeeEstimates);
  const maxFeePerGas = decGWEIToHexWEI(
    gasFeeEstimates?.high?.suggestedMaxFeePerGas,
  );
  const maxPriorityFeePerGas = decGWEIToHexWEI(
    gasFeeEstimates?.high?.suggestedMaxPriorityFeePerGas,
  );

  const isTxSubmittable =
    fromToken &&
    toToken &&
    fromChain &&
    toChain &&
    fromAmount &&
    recommendedQuote?.toTokenAmount?.raw;

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('confirm');
    }

    return t('swapSelectToken');
  }, [isLoading, fromAmount, toToken, isTxSubmittable]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (isTxSubmittable) {
          dispatch(
            submitBridgeTransaction(
              recommendedQuote,
              history,
              maxFeePerGas,
              maxPriorityFeePerGas,
            ),
          );
        }
      }}
      disabled={!isTxSubmittable}
    >
      {label}
    </Button>
  );
};
