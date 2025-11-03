import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  formatChainIdToCaip,
  selectBridgeQuotes,
} from '@metamask/bridge-controller';
import {
  toCaipAccountId,
  parseCaipChainId,
  type CaipAccountId,
  isValidHexAddress,
  Hex,
} from '@metamask/utils';
import log from 'loglevel';
import {
  getFromToken,
  getToToken,
  getQuoteRequest,
} from '../../ducks/bridge/selectors';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { usePrevious } from '../usePrevious';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getRewardsHasAccountOptedIn,
  estimateRewardsPoints,
} from '../../store/actions';
import {
  EstimateAssetDto,
  EstimatePointsDto,
  EstimatedPointsDto,
} from '../../../shared/types/rewards';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { useRewardsContext } from '../rewards';

/**
 *
 * @param totalFeeAmountUsd - The total fee amount in USD
 * @param feeAmountAtomic - The fee amount in atomic units
 * @param feeAssetDecimals - The decimals of the fee asset
 * @returns The USD price per token
 */
export const getUsdPricePerToken = (
  totalFeeAmountUsd: string,
  feeAmountAtomic: string,
  feeAssetDecimals: number,
): string | undefined => {
  try {
    // Use BigNumber for precision-safe arithmetic
    const totalFeeUsd = new BigNumber(totalFeeAmountUsd);
    const feeAmountAtomicBN = new BigNumber(feeAmountAtomic);
    const feeAmountBN = feeAmountAtomicBN.div(
      new BigNumber(10).pow(feeAssetDecimals),
    );

    if (totalFeeUsd.isZero() || feeAmountBN.isZero()) {
      return undefined;
    }

    return totalFeeUsd.dividedBy(feeAmountBN).toString();
  } catch (error) {
    console.error(
      error as Error,
      'useRewards: Error calculating USD price per token',
    );
    return undefined;
  }
};

type UseRewardsResult = {
  shouldShowRewardsRow: boolean;
  isLoading: boolean;
  estimatedPoints: number | null;
  hasError: boolean;
};

/**
 * Formats an address to CAIP-10 account ID
 *
 * @param address
 * @param chainId
 */
const formatAccountToCaipAccountId = (
  address: string,
  chainId: string,
): CaipAccountId | null => {
  try {
    const caipChainId = formatChainIdToCaip(chainId);
    const { namespace, reference } = parseCaipChainId(caipChainId);
    const coercedAddress = isValidHexAddress(address as Hex)
      ? toChecksumHexAddress(address)
      : address;
    return toCaipAccountId(namespace, reference, coercedAddress);
  } catch (error) {
    log.error('[useRewards] Error formatting account to CAIP-10:', error);
    return null;
  }
};

type UseRewardsParams = {
  activeQuote: NonNullable<
    NonNullable<ReturnType<typeof selectBridgeQuotes>['activeQuote']>['quote']
  > | null;
};

export const useRewards = ({
  activeQuote,
}: UseRewardsParams): UseRewardsResult => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState<number | null>(null);
  const [shouldShowRewardsRow, setShouldShowRewardsRow] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevRequestId = usePrevious(activeQuote?.requestId);
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const quoteRequest = useSelector(getQuoteRequest);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);
  const { rewardsEnabled } = useRewardsContext();

  const estimatePoints = useCallback(
    async (
      estimationQuoteArg:
        | NonNullable<
            ReturnType<typeof selectBridgeQuotes>['activeQuote']
          >['quote']
        | null,
    ) => {
      // Skip if no active quote or missing required data
      if (
        !estimationQuoteArg ||
        !fromToken ||
        !toToken ||
        !quoteRequest.srcTokenAmount ||
        !selectedAccount?.address ||
        !currentChainId ||
        !rewardsEnabled
      ) {
        setEstimatedPoints(null);
        setShouldShowRewardsRow(false);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setShouldShowRewardsRow(true);
      setHasError(false);

      try {
        // Format account to CAIP-10
        const caipAccount = formatAccountToCaipAccountId(
          selectedAccount.address,
          currentChainId.toString(),
        );

        if (!caipAccount) {
          setEstimatedPoints(null);
          setShouldShowRewardsRow(false);
          setIsLoading(false);
          setHasError(false);
          return;
        }

        // Check if account has opted in
        const hasOptedIn = await dispatch(
          getRewardsHasAccountOptedIn(caipAccount),
        );

        if (!hasOptedIn) {
          setEstimatedPoints(null);
          setShouldShowRewardsRow(false);
          setIsLoading(false);
          setHasError(false);
          return;
        }

        // Convert source amount to atomic unit
        const atomicSourceAmount = estimationQuoteArg.srcTokenAmount;

        // Get destination amount from quote
        const atomicDestAmount = estimationQuoteArg.destTokenAmount;

        // Prepare source asset
        const srcAsset: EstimateAssetDto = {
          id: estimationQuoteArg.srcAsset.assetId,
          amount: atomicSourceAmount,
        };

        // Prepare destination asset
        const destAsset: EstimateAssetDto = {
          id: estimationQuoteArg.destAsset.assetId,
          amount: atomicDestAmount,
        };

        // Prepare fee asset (using MetaMask fee from quote data)
        const feeAsset: EstimateAssetDto = {
          id: estimationQuoteArg.feeData.metabridge.asset.assetId,
          amount: estimationQuoteArg.feeData.metabridge.amount || '0',
        };

        const usdPricePerToken = getUsdPricePerToken(
          estimationQuoteArg.priceData?.totalFeeAmountUsd || '0',
          feeAsset.amount,
          estimationQuoteArg.feeData.metabridge.asset.decimals,
        );

        const feeAssetWithUsdPrice: EstimateAssetDto = {
          ...feeAsset,
          ...(usdPricePerToken ? { usdPrice: usdPricePerToken } : {}),
        };

        // Create estimate request
        const estimateRequest: EstimatePointsDto = {
          activityType: 'SWAP',
          account: caipAccount,
          activityContext: {
            swapContext: {
              srcAsset,
              destAsset,
              feeAsset: feeAssetWithUsdPrice,
            },
          },
        };

        // Call rewards controller to estimate points
        const result = (await dispatch(
          estimateRewardsPoints(estimateRequest),
        )) as unknown as EstimatedPointsDto;

        setEstimatedPoints(result.pointsEstimate);
      } catch (error) {
        log.error('[useRewards] Error estimating points:', error);
        setEstimatedPoints(null);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [
      fromToken,
      toToken,
      quoteRequest.srcTokenAmount,
      selectedAccount.address,
      currentChainId,
      rewardsEnabled,
      dispatch,
    ],
  );

  // Estimate points when dependencies change
  useEffect(() => {
    if (prevRequestId !== activeQuote?.requestId) {
      estimatePoints(activeQuote);
    }
  }, [
    estimatePoints,
    // Only re-estimate when quote changes (not during loading)
    activeQuote?.requestId,
    activeQuote,
    prevRequestId,
  ]);

  return {
    shouldShowRewardsRow,
    isLoading,
    estimatedPoints,
    hasError,
  };
};
