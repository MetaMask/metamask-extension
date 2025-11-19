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
import { debounce } from 'lodash';
import {
  getFromToken,
  getToToken,
  getQuoteRequest,
} from '../../ducks/bridge/selectors';
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
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import { selectRewardsEnabled } from '../../ducks/rewards/selectors';

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

type UseRewardsWithQuoteParams = {
  quote: NonNullable<
    NonNullable<ReturnType<typeof selectBridgeQuotes>['activeQuote']>['quote']
  > | null;
  fromAddress: string | null | undefined;
  chainId: string | null | undefined;
};

/**
 * A hook that accepts quote, fromAddress, and chainId as arguments
 * and estimates rewards for the given quote.
 *
 * @param options - The hook parameters
 * @param options.quote - The bridge quote to estimate rewards for
 * @param options.fromAddress - The address sending the transaction
 * @param options.chainId - The chain ID for the transaction
 * @returns An object containing rewards estimation state
 */
export const useRewardsWithQuote = ({
  quote,
  fromAddress,
  chainId,
}: UseRewardsWithQuoteParams): UseRewardsResult => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState<number | null>(null);
  const [shouldShowRewardsRow, setShouldShowRewardsRow] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevRequestId = usePrevious(quote?.requestId);
  const rewardsEnabled = useSelector(selectRewardsEnabled);

  const debouncedEstimatePoints = useCallback(
    debounce(
      async (
        estimationQuoteArg:
          | NonNullable<
              ReturnType<typeof selectBridgeQuotes>['activeQuote']
            >['quote']
          | null,
        caipAccountArg: CaipAccountId | null,
      ) => {
        // Skip if no active quote or missing required data
        if (!estimationQuoteArg || !caipAccountArg) {
          setEstimatedPoints(null);
          setShouldShowRewardsRow(false);
          setIsLoading(false);
          setHasError(false);
          return;
        }

        try {
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
            account: caipAccountArg,
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
          log.error('[useRewardsWithQuote] Error estimating points:', error);
          setEstimatedPoints(null);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      },
      750,
    ),
    [dispatch],
  );

  const estimatePoints = useCallback(
    async (
      estimationQuoteArg:
        | NonNullable<
            ReturnType<typeof selectBridgeQuotes>['activeQuote']
          >['quote']
        | null,
    ) => {
      // Skip if no active quote or missing required data
      if (!estimationQuoteArg || !fromAddress || !chainId || !rewardsEnabled) {
        setEstimatedPoints(null);
        setShouldShowRewardsRow(false);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      let caipAccount: CaipAccountId | null = null;

      try {
        // Format account to CAIP-10
        caipAccount = formatAccountToCaipAccountId(fromAddress, chainId);

        if (!caipAccount) {
          return;
        }

        // Check if account has opted in
        const hasOptedIn = await dispatch(
          getRewardsHasAccountOptedIn(caipAccount),
        );

        if (!hasOptedIn) {
          setIsLoading(false);
          setShouldShowRewardsRow(false);
          setEstimatedPoints(null);
          setHasError(false);
          return;
        }

        setIsLoading(true);
        setShouldShowRewardsRow(true);
        setEstimatedPoints(null);
        setHasError(false);

        await debouncedEstimatePoints(estimationQuoteArg, caipAccount);
      } catch {
        // Failed to detect opt in
        setIsLoading(false);
        setShouldShowRewardsRow(false);
        setEstimatedPoints(null);
        setHasError(false);
      }
    },
    [fromAddress, chainId, rewardsEnabled, debouncedEstimatePoints, dispatch],
  );

  // Estimate points when dependencies change
  useEffect(() => {
    if (prevRequestId !== quote?.requestId) {
      estimatePoints(quote);
    }
  }, [
    estimatePoints,
    // Only re-estimate when quote changes (not during loading)
    quote?.requestId,
    quote,
    prevRequestId,
  ]);

  return {
    shouldShowRewardsRow,
    isLoading,
    estimatedPoints,
    hasError,
  };
};

/**
 * A hook that reads data from Redux selectors and passes it to useRewardsWithQuote.
 * Includes Bridge-specific validation checks for fromToken, toToken, and quoteRequest
 * and passes the data to useRewardsWithQuote.
 *
 * @param options - The hook parameters
 * @param options.activeQuote - The active bridge quote
 * @returns An object containing rewards estimation state
 */
export const useRewards = ({
  activeQuote,
}: UseRewardsParams): UseRewardsResult => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const quoteRequest = useSelector(getQuoteRequest);
  const currentChainId = useMultichainSelector(getMultichainCurrentChainId);
  const caipChainId = currentChainId
    ? formatChainIdToCaip(currentChainId.toString())
    : null;
  const selectedAccount = useSelector((state) =>
    caipChainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId)
      : null,
  );

  // Bridge-specific validation: ensure all required Bridge UI data is present
  const hasRequiredBridgeData =
    fromToken &&
    toToken &&
    quoteRequest?.srcTokenAmount &&
    selectedAccount?.address;

  // Pass null for quote if Bridge validation fails to prevent estimation
  return useRewardsWithQuote({
    quote: hasRequiredBridgeData ? activeQuote : null,
    fromAddress: selectedAccount?.address,
    chainId: currentChainId?.toString(),
  });
};
