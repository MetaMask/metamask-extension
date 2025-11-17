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
  type CaipChainId,
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
import { usePrevious } from '../usePrevious';
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
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';

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
  const { rewardsEnabled } = useRewardsContext();
  const getSelectedAccountByScope = useSelector(
    (state) => (scope: CaipChainId) =>
      getInternalAccountBySelectedAccountGroupAndCaip(state, scope),
  );
  const sourceChainId = fromToken?.chainId
    ? formatChainIdToCaip(fromToken.chainId)
    : undefined;
  const selectedAccount = sourceChainId
    ? getSelectedAccountByScope(sourceChainId)
    : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          log.error('[useRewards] Error estimating points:', error);
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
      if (
        !estimationQuoteArg ||
        !fromToken ||
        !toToken ||
        !selectedAccount?.address ||
        !quoteRequest?.srcTokenAmount ||
        !sourceChainId ||
        !rewardsEnabled
      ) {
        setEstimatedPoints(null);
        setShouldShowRewardsRow(false);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      let caipAccount: CaipAccountId | null = null;

      try {
        // Format account to CAIP-10
        caipAccount = formatAccountToCaipAccountId(
          selectedAccount.address,
          sourceChainId,
        );

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
    [
      fromToken,
      toToken,
      selectedAccount,
      quoteRequest,
      sourceChainId,
      rewardsEnabled,
      debouncedEstimatePoints,
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
