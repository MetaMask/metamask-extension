import { useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import log from 'loglevel';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { queryClient } from '../../contexts/query-client';
import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import { invalidateMoneyAccountBalanceCaches } from '../../helpers/money/invalidate-balance-caches';
import {
  isMoneyAccountTx,
  isPerpsPredictMoneyActivity,
} from '../../helpers/money/money-transaction-guards';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import type { MetaMaskReduxState } from '../../store/store';
import { useMessenger } from '../useMessenger';

const LOG_PREFIX = '[Money Balance Refresh]';

const MAX_RETRIES = 4;
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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const readBalanceSnapshot = (address: string) =>
  queryClient.getQueryData<MoneyBalanceSnapshot>([
    MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
    address,
  ]);

const didBalanceChange = (
  before: MoneyBalanceSnapshot,
  after: MoneyBalanceSnapshot,
) => before?.totalBalance !== after?.totalBalance;

/**
 * Capture the pre-invalidation cached snapshot as a baseline, then invalidate +
 * refetch and compare. Retry up to MAX_RETRIES times if subsequent reads are
 * byte-identical to baseline. Guards against RPC nodes / API indexes serving
 * stale reads immediately after a transaction confirms. Fails visibly via
 * log.error if the retry budget exhausts.
 *
 * @param address - Money account address.
 */
const refreshMoneyBalanceQueries = async (address: string) => {
  const baseline = readBalanceSnapshot(address);

  log.debug(`${LOG_PREFIX} Baseline snapshot established`, { baseline });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(
        Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS),
      );
    }

    await invalidateMoneyAccountBalanceCaches(address);
    const next = readBalanceSnapshot(address);
    const changed = didBalanceChange(baseline, next);

    log.debug(`${LOG_PREFIX} attempt ${attempt} result`, { changed, next });

    if (changed) {
      return;
    }
  }

  log.error(
    `${LOG_PREFIX} Balance unchanged after ${MAX_RETRIES} retries; awaiting 30s auto-poll`,
  );
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

      refreshMoneyBalanceQueries(address).catch((error) => {
        log.error(`${LOG_PREFIX} Balance refresh failed`, error);
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
