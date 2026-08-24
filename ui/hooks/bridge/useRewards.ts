import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  formatChainIdToCaip,
  selectBridgeQuotes,
  type QuoteResponse,
  type QuoteResponseV1,
} from '@metamask/bridge-controller';
import { type CaipAccountId } from '@metamask/utils';
import { debounce } from 'lodash';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
  rewardsIsOptInSupported,
  getRewardsCandidateSubscriptionId,
} from '../../store/actions';
import { formatAccountToCaipAccountId } from '../../helpers/utils/rewards-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  selectRewardsAccountLinkedTimestamp,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import { usePrimaryWalletGroupAccounts } from '../rewards/usePrimaryWalletGroupAccounts';
import { useDispatch } from '../../store/hooks';

// Set to true when a rewards season is active and points estimation should run.
const REWARDS_SEASON_ACTIVE = false;

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
  accountOptedIn: boolean | null;
  rewardsAccountScope: InternalAccount | null;
};

type UseRewardsParams = {
  activeQuote: NonNullable<
    NonNullable<ReturnType<typeof selectBridgeQuotes>['activeQuote']>['quote']
  > | null;
};

type UseRewardsWithQuoteParams = {
  quote: QuoteResponse['quote'] | QuoteResponseV1['quote'] | null;
  fromAddress: string | null | undefined;
  fromAddressAccount?: InternalAccount | null;
  chainId: string | null | undefined;
};

type RewardsOptInDetectionResult =
  | { status: 'error' }
  | {
      status: 'ok';
      accountOptedIn: boolean | null;
      shouldShow: boolean;
      caipAccount: CaipAccountId | null;
      shouldEstimate: boolean;
    };

/**
 * Extracted so React Compiler can optimize the hook: try/catch with
 * conditional value blocks inside a component is unsupported.
 *
 * @param params
 * @param params.dispatch
 * @param params.primaryWalletGroupAccounts
 * @param params.fromAddress
 * @param params.chainId
 * @param params.fromAddressAccount
 */
async function detectRewardsOptIn({
  dispatch,
  primaryWalletGroupAccounts,
  fromAddress,
  chainId,
  fromAddressAccount,
}: {
  dispatch: ReturnType<typeof useDispatch>;
  primaryWalletGroupAccounts: InternalAccount[];
  fromAddress: string;
  chainId: string;
  fromAddressAccount?: InternalAccount | null;
}): Promise<RewardsOptInDetectionResult> {
  try {
    const candidateSubscriptionId = (await dispatch(
      getRewardsCandidateSubscriptionId(primaryWalletGroupAccounts),
    )) as unknown as string | null;

    if (!candidateSubscriptionId) {
      return {
        status: 'ok',
        accountOptedIn: null,
        shouldShow: false,
        caipAccount: null,
        shouldEstimate: false,
      };
    }

    const caipAccount = formatAccountToCaipAccountId(fromAddress, chainId);

    if (!caipAccount) {
      return {
        status: 'ok',
        accountOptedIn: null,
        shouldShow: false,
        caipAccount: null,
        shouldEstimate: false,
      };
    }

    const hasOptedIn = (await dispatch(
      getRewardsHasAccountOptedIn(caipAccount),
    )) as unknown as boolean;

    let shouldShow = hasOptedIn;
    if (!hasOptedIn && fromAddressAccount) {
      const isOptInSupported = (await dispatch(
        rewardsIsOptInSupported({ account: fromAddressAccount }),
      )) as unknown as boolean;
      shouldShow = isOptInSupported;
    }

    return {
      status: 'ok',
      accountOptedIn: hasOptedIn,
      shouldShow,
      caipAccount,
      shouldEstimate: shouldShow && hasOptedIn,
    };
  } catch {
    return { status: 'error' };
  }
}

/**
 * A hook that accepts quote, fromAddress, and chainId as arguments
 * and estimates rewards for the given quote.
 *
 * @param options - The hook parameters
 * @param options.quote - The bridge quote to estimate rewards for
 * @param options.fromAddress - The address sending the transaction
 * @param options.fromAddressAccount - The account sending the transaction
 * @param options.chainId - The chain ID for the transaction
 * @returns An object containing rewards estimation state
 */
export const useRewardsWithQuote = ({
  quote,
  fromAddress,
  fromAddressAccount,
  chainId,
}: UseRewardsWithQuoteParams): UseRewardsResult => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState<number | null>(null);
  const [shouldShowRewardsRow, setShouldShowRewardsRow] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevRequestId = usePrevious(quote?.requestId);
  const [accountOptedIn, setAccountOptedIn] = useState<boolean | null>(null);
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsAccountLinkedTimestamp = useSelector(
    selectRewardsAccountLinkedTimestamp,
  );
  const { accounts: primaryWalletGroupAccounts } =
    usePrimaryWalletGroupAccounts();
  const accountLinkedTimestampsRef = useRef(new Map<string, number | null>());
  const [currentAccountLinkedTimestamp, setCurrentAccountLinkedTimestamp] =
    useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      if (!fromAddress) {
        setCurrentAccountLinkedTimestamp(null);
        return;
      }

      if (rewardsAccountLinkedTimestamp !== null) {
        accountLinkedTimestampsRef.current.set(
          fromAddress,
          rewardsAccountLinkedTimestamp,
        );
        setCurrentAccountLinkedTimestamp(rewardsAccountLinkedTimestamp);
        return;
      }

      setCurrentAccountLinkedTimestamp(
        accountLinkedTimestampsRef.current.get(fromAddress) ?? null,
      );
    });
  }, [fromAddress, rewardsAccountLinkedTimestamp]);

  // `debounce()` returns a new stateful function on every call, so it has to be
  // built inside a `useMemo` factory — passing it to `useCallback` would construct
  // (and discard) a fresh timer-holding instance on every render.
  const debouncedEstimatePoints = useMemo(
    () =>
      debounce(
        async (
          _estimationQuoteArg:
            | QuoteResponse['quote']
            | QuoteResponseV1['quote']
            | null,
          _caipAccountArg: CaipAccountId | null,
        ) => {
          setEstimatedPoints(null);
          setShouldShowRewardsRow(false);
          setIsLoading(false);
          setHasError(false);
        },
        750,
      ),
    [dispatch],
  );

  useEffect(() => {
    return () => {
      debouncedEstimatePoints.cancel();
    };
  }, [debouncedEstimatePoints]);

  const estimatePoints = useCallback(
    async (
      estimationQuoteArg:
        | QuoteResponse['quote']
        | QuoteResponseV1['quote']
        | null,
    ) => {
      // Skip if no active quote or missing required data, or if no season is active
      if (
        !REWARDS_SEASON_ACTIVE ||
        !estimationQuoteArg ||
        !fromAddress ||
        !chainId ||
        !rewardsEnabled
      ) {
        setEstimatedPoints(null);
        setShouldShowRewardsRow(false);
        setAccountOptedIn(null);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const detection = await detectRewardsOptIn({
        dispatch,
        primaryWalletGroupAccounts,
        fromAddress,
        chainId,
        fromAddressAccount,
      });

      if (detection.status === 'error') {
        setIsLoading(false);
        setShouldShowRewardsRow(false);
        setEstimatedPoints(null);
        setAccountOptedIn(null);
        setHasError(false);
        return;
      }

      setAccountOptedIn(detection.accountOptedIn);
      setShouldShowRewardsRow(detection.shouldShow);
      setEstimatedPoints(null);
      setHasError(false);

      if (!detection.shouldEstimate || !detection.caipAccount) {
        setIsLoading(false);
        return;
      }

      await debouncedEstimatePoints(estimationQuoteArg, detection.caipAccount);
    },
    [
      fromAddress,
      chainId,
      rewardsEnabled,
      dispatch,
      fromAddressAccount,
      debouncedEstimatePoints,
      primaryWalletGroupAccounts,
    ],
  );

  // Estimate points when dependencies change.
  // Defer so setState inside estimatePoints is not synchronous in the effect body.
  useEffect(() => {
    if (prevRequestId !== quote?.requestId) {
      queueMicrotask(() => {
        estimatePoints(quote);
      });
    }
  }, [
    estimatePoints,
    // Only re-estimate when quote changes (not during loading)
    quote?.requestId,
    quote,
    prevRequestId,
  ]);

  // Re-estimate points when account linked timestamp changes and account has opted in False
  // Only trigger if the current account has a linked timestamp (was actually linked)
  useEffect(() => {
    if (currentAccountLinkedTimestamp !== null && accountOptedIn === false) {
      queueMicrotask(() => {
        estimatePoints(quote);
      });
    }
  }, [currentAccountLinkedTimestamp, accountOptedIn, estimatePoints, quote]);

  return {
    shouldShowRewardsRow,
    isLoading,
    estimatedPoints,
    hasError,
    accountOptedIn,
    rewardsAccountScope:
      quote && shouldShowRewardsRow
        ? (fromAddressAccount as InternalAccount | null)
        : null,
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
    fromAddressAccount: selectedAccount,
    chainId: currentChainId?.toString(),
  });
};
