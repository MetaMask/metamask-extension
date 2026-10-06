import { useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type {
  CanonicalMoneyAccountBalanceResponse,
  FetchBalanceWithFallbackOptions,
} from '@metamask/money-account-balance-service';
import { MUSD_MONEY_ACCOUNT_CHAIN_IDS } from '@metamask/money-account-utils';
import { hexToNumber } from '@metamask/utils';
import log from 'loglevel';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { queryClient } from '../../contexts/query-client';
import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import {
  fetchFreshMoneyAccountBalance,
  invalidateMoneyAccountBalanceSourceCaches,
} from '../../helpers/money/invalidate-balance-caches';
import { reportMoneyError } from '../../helpers/money/report-money-error';
import {
  isMoneyAccountTx,
  isPerpsPredictMoneyActivity,
} from '../../helpers/money/money-transaction-guards';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import type { MetaMaskReduxState } from '../../store/types';
import { useMessenger } from '../useMessenger';

const LOG_PREFIX = '[Money Balance Refresh]';

// Wider than mobile's 4-attempt budget: RPC nodes and the Money API indexer
// can lag the on-chain state by tens of seconds after a confirmation, and an
// exhausted budget costs a full staleTime + poll cycle before the next fresh
// read. 8 attempts with capped backoff cover a ~20s window.
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 4000;

export const refreshMoneyBalanceCapabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: ['TransactionController:transactionStatusUpdated'],
});

type RefreshMoneyBalanceMessenger = RouteMessengerFromCapabilities<
  typeof refreshMoneyBalanceCapabilities
>;

type MoneyBalanceSnapshot = CanonicalMoneyAccountBalanceResponse | undefined;

type RefreshOptions = { minBlock?: number };

type InFlightRefresh = { pending?: RefreshOptions };

// One refresh per address: concurrent loops bust each other's source caches and
// compare against a baseline the other has moved.
const inFlightRefreshByAddress = new Map<string, InFlightRefresh>();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const readBalanceSnapshot = (address: string) =>
  queryClient.getQueryData<MoneyBalanceSnapshot>([
    MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
    address,
  ]);

const didBalanceChange = (
  before: MoneyBalanceSnapshot,
  after: CanonicalMoneyAccountBalanceResponse,
) => {
  // No cached total means this read is the first figure the UI has. Treat it
  // as a change so the refresh stops instead of retrying against nothing.
  if (before?.totalBalance === undefined) {
    return true;
  }

  return before.totalBalance !== after.totalBalance;
};

/**
 * `as_of_block` is a Money Account chain block. Receipt block numbers on other
 * chains (Perps/Predict on Arbitrum or Polygon) are not comparable, so those
 * refreshes send `fresh` only.
 *
 * @param transactionMeta - Confirmed transaction.
 * @returns The receipt block as a number, or undefined when it cannot gate the API.
 */
const resolveMinBlock = (
  transactionMeta: TransactionMeta,
): number | undefined => {
  const { chainId, txReceipt } = transactionMeta;
  const blockNumber = txReceipt?.blockNumber;

  if (
    chainId === undefined ||
    blockNumber === undefined ||
    !MUSD_MONEY_ACCOUNT_CHAIN_IDS.includes(chainId)
  ) {
    return undefined;
  }

  try {
    return hexToNumber(blockNumber);
  } catch (error) {
    log.debug(`${LOG_PREFIX} Could not read receipt block`, { error });
    return undefined;
  }
};

/**
 * True when the API read is at or past the confirmed transaction's block.
 * That result is authoritative even if the total is unchanged (for example a
 * deposit that only moved funds between mUSD and vmUSD, or a no-op confirm).
 *
 * @param result - Canonical balance returned by the service.
 * @param minBlock - Confirmed block to satisfy, when the tx was on the Money chain.
 */
const isAuthoritativeApiRead = (
  result: CanonicalMoneyAccountBalanceResponse,
  minBlock: number | undefined,
) =>
  minBlock !== undefined &&
  result.source === 'api' &&
  result.asOfBlock !== undefined &&
  result.asOfBlock >= minBlock;

/**
 * Capture the pre-refresh cached snapshot as a baseline, then request a fresh
 * balance (with `minBlock` when the confirmation is on the Money Account
 * chain) and compare. Retry up to MAX_RETRIES times while the API is still
 * behind the confirmed block and the total has not moved. A failed attempt
 * counts as a miss and the loop continues until the budget is spent. Reports
 * to Sentry if the retry budget exhausts.
 *
 * Each attempt busts the background source caches first so an RPC primary or
 * RPC fallback cannot answer from its `staleTime` entry. On exhaustion those
 * caches are busted once more: the last read re-cached whatever it returned.
 *
 * @param address - Money account address.
 * @param options - Freshness controls for this confirmation.
 * @param options.minBlock - Money Account chain block the API read must reach.
 */
const refreshMoneyBalanceQueries = async (
  address: string,
  { minBlock }: RefreshOptions,
) => {
  const baseline = readBalanceSnapshot(address);
  const requestOptions: FetchBalanceWithFallbackOptions = { fresh: true };
  if (minBlock !== undefined) {
    requestOptions.minBlock = minBlock;
  }

  log.debug(`${LOG_PREFIX} Baseline snapshot established`, {
    baseline,
    minBlock,
  });

  let sawResult = false;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS));
    }

    try {
      await invalidateMoneyAccountBalanceSourceCaches(address);
      const next = await fetchFreshMoneyAccountBalance(address, requestOptions);
      sawResult = true;
      const authoritative = isAuthoritativeApiRead(next, minBlock);
      const changed = didBalanceChange(baseline, next);

      log.debug(`${LOG_PREFIX} attempt ${attempt} result`, {
        authoritative,
        changed,
        minBlock,
        source: next.source,
        asOfBlock: next.asOfBlock,
        next,
      });

      if (authoritative || changed) {
        return;
      }
    } catch (error) {
      lastError = error;
      log.debug(`${LOG_PREFIX} attempt ${attempt} failed`, { error, minBlock });
    }
  }

  try {
    await invalidateMoneyAccountBalanceSourceCaches(address);
  } catch (error) {
    log.debug(`${LOG_PREFIX} Final source cache bust failed`, { error });
  }

  if (!sawResult && lastError !== undefined) {
    reportMoneyError(`${LOG_PREFIX} Balance refresh failed`, lastError, {
      attempts: MAX_RETRIES,
    });
    return;
  }

  reportMoneyError(
    `${LOG_PREFIX} Balance unchanged after ${MAX_RETRIES} retries; awaiting 30s auto-poll`,
    new Error('Money Account balance unchanged after retries'),
    { attempts: MAX_RETRIES },
  );
};

const mergeRefreshOptions = (
  queued: RefreshOptions | undefined,
  incoming: RefreshOptions,
): RefreshOptions => {
  const minBlocks = [queued?.minBlock, incoming.minBlock].filter(
    (block): block is number => block !== undefined,
  );
  return minBlocks.length > 0 ? { minBlock: Math.max(...minBlocks) } : {};
};

/**
 * Runs at most one refresh per address. A confirmation that lands while a
 * refresh is running queues a single follow-up run (merged to the highest
 * `minBlock`) instead of starting a competing loop, because the running loop
 * may stop at the earlier block before the later transaction is reflected.
 *
 * @param address - Money account address.
 * @param options - Freshness controls for this confirmation.
 */
const requestMoneyBalanceRefresh = async (
  address: string,
  options: RefreshOptions,
): Promise<void> => {
  const inFlight = inFlightRefreshByAddress.get(address);
  if (inFlight) {
    inFlight.pending = mergeRefreshOptions(inFlight.pending, options);
    return;
  }

  const refresh: InFlightRefresh = {};
  inFlightRefreshByAddress.set(address, refresh);
  try {
    let next: RefreshOptions | undefined = options;
    while (next) {
      refresh.pending = undefined;
      await refreshMoneyBalanceQueries(address, next);
      next = refresh.pending;
    }
  } finally {
    inFlightRefreshByAddress.delete(address);
  }
};

/**
 * Refreshes the Money Account balance when a transaction that moves money
 * balance confirms: direct Money txs (deposit/withdraw, including nested in a
 * batch) plus Perps/Predict transfers to or from the Money account (paid with
 * mUSD via MetaMask Pay).
 *
 * Extension adaptation of mobile's `useRefreshMoneyBalanceOnTxConfirm`: the
 * confirmation signal is `TransactionController:transactionStatusUpdated`
 * filtered to `confirmed` (the event the route messenger exposes) rather than
 * `transactionConfirmed`, so refreshes are deduped by transaction id in case
 * the status event re-fires.
 */
export function useRefreshMoneyBalanceOnTxConfirm(): void {
  const messenger = useMessenger<RefreshMoneyBalanceMessenger>();
  const store = useStore<MetaMaskReduxState>();
  const refreshedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleStatusUpdated = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      const payload = Array.isArray(raw) ? raw[0] : raw;
      const transactionMeta = payload?.transactionMeta;

      if (!transactionMeta) {
        return;
      }

      if (transactionMeta.status !== TransactionStatus.confirmed) {
        return;
      }

      const address = selectPrimaryMoneyAccount(store.getState())?.address;
      if (!address) {
        return;
      }

      const affectsMoneyBalance =
        isMoneyAccountTx(transactionMeta) ||
        isPerpsPredictMoneyActivity(transactionMeta);
      if (!affectsMoneyBalance) {
        return;
      }

      if (refreshedIdsRef.current.has(transactionMeta.id)) {
        return;
      }
      refreshedIdsRef.current.add(transactionMeta.id);

      requestMoneyBalanceRefresh(address, {
        minBlock: resolveMinBlock(transactionMeta),
      }).catch((error) => {
        reportMoneyError(`${LOG_PREFIX} Balance refresh failed`, error, {
          attempts: MAX_RETRIES,
        });
      });
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleStatusUpdated,
    );

    return () => {
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleStatusUpdated,
      );
    };
  }, [messenger, store]);
}
