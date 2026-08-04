import type {
  MoneyAccountBalanceServiceFetchBalanceWithFallbackAction,
  MoneyAccountBalanceServiceGetExchangeRateAction,
  MoneyAccountBalanceServiceGetMoneyAccountBalanceAction,
  MoneyAccountBalanceServiceGetMusdBalanceAction,
  MoneyAccountBalanceServiceGetMusdEquivalentValueAction,
  MoneyAccountBalanceServiceGetVaultApyAction,
  MoneyAccountBalanceServiceGetVmusdBalanceAction,
} from '@metamask/money-account-balance-service';
import type {
  MoneyAccountApiDataServiceFetchInterestAction,
  MoneyAccountApiDataServiceFetchPositionsAction,
} from '@metamask/money-account-api-data-service';

/**
 * The balance-service action types a query key may name. Used to hold the
 * registry below to the actions the installed service actually exposes.
 */
type MoneyAccountBalanceServiceQueryAction =
  | MoneyAccountBalanceServiceFetchBalanceWithFallbackAction
  | MoneyAccountBalanceServiceGetExchangeRateAction
  | MoneyAccountBalanceServiceGetMoneyAccountBalanceAction
  | MoneyAccountBalanceServiceGetMusdBalanceAction
  | MoneyAccountBalanceServiceGetMusdEquivalentValueAction
  | MoneyAccountBalanceServiceGetVaultApyAction
  | MoneyAccountBalanceServiceGetVmusdBalanceAction;

/**
 * The API-data-service action types a query key may name.
 */
type MoneyAccountApiDataServiceQueryAction =
  | MoneyAccountApiDataServiceFetchInterestAction
  | MoneyAccountApiDataServiceFetchPositionsAction;

/**
 * First element of every `useQuery` key that reads a Money Account balance,
 * i.e. the messenger action the UI query client calls in the background.
 *
 * The values are written out rather than derived from
 * `MoneyAccountBalanceService.name`, the way mobile does it, because class
 * names are not stable under minification here. `satisfies` cross-checks each
 * string against the action types the installed package exposes, so a typo or
 * a renamed action fails `tsc` instead of silently producing a key that never
 * resolves.
 */
export const MoneyAccountBalanceServiceQueryKeys = {
  GET_MUSD_BALANCE: 'MoneyAccountBalanceService:getMusdBalance',
  GET_VMUSD_BALANCE: 'MoneyAccountBalanceService:getVmusdBalance',
  GET_VAULT_APY: 'MoneyAccountBalanceService:getVaultApy',
  /** Internally, this helper fetches the vmUSD balance and exchange rate */
  GET_MUSD_EQUIVALENT_VALUE:
    'MoneyAccountBalanceService:getMusdEquivalentValue',
  GET_EXCHANGE_RATE: 'MoneyAccountBalanceService:getExchangeRate',
  /**
   * RPC Multicall3 source adapter used internally by
   * {@link MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK}.
   * Not for presentation — invalidate alongside the facade on forced refresh.
   */
  GET_MONEY_ACCOUNT_BALANCE:
    'MoneyAccountBalanceService:getMoneyAccountBalance',
  /**
   * Canonical Money Account balance via API/RPC facade
   * (`fetchBalanceWithFallback`). Prefer this for presentation.
   */
  FETCH_BALANCE_WITH_FALLBACK:
    'MoneyAccountBalanceService:fetchBalanceWithFallback',
} as const satisfies Record<
  string,
  MoneyAccountBalanceServiceQueryAction['type']
>;

export const MoneyAccountApiDataServiceQueryKeys = {
  /**
   * Money API positions (includes optional `balance` summary). Used as the API
   * source adapter behind `fetchBalanceWithFallback`. The package lowercases
   * the address in the query key.
   */
  FETCH_POSITIONS: 'MoneyAccountApiDataService:fetchPositions',
  /**
   * Interest earned by a Money Account position for a requested time window.
   */
  FETCH_INTEREST: 'MoneyAccountApiDataService:fetchInterest',
} as const satisfies Record<
  string,
  MoneyAccountApiDataServiceQueryAction['type']
>;
