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

type MoneyAccountBalanceServiceQueryAction =
  | MoneyAccountBalanceServiceFetchBalanceWithFallbackAction
  | MoneyAccountBalanceServiceGetExchangeRateAction
  | MoneyAccountBalanceServiceGetMoneyAccountBalanceAction
  | MoneyAccountBalanceServiceGetMusdBalanceAction
  | MoneyAccountBalanceServiceGetMusdEquivalentValueAction
  | MoneyAccountBalanceServiceGetVaultApyAction
  | MoneyAccountBalanceServiceGetVmusdBalanceAction;

type MoneyAccountApiDataServiceQueryAction =
  | MoneyAccountApiDataServiceFetchInterestAction
  | MoneyAccountApiDataServiceFetchPositionsAction;

export const MoneyAccountBalanceServiceQueryKeys = {
  GET_MUSD_BALANCE: 'MoneyAccountBalanceService:getMusdBalance',
  GET_VMUSD_BALANCE: 'MoneyAccountBalanceService:getVmusdBalance',
  GET_VAULT_APY: 'MoneyAccountBalanceService:getVaultApy',
  GET_MUSD_EQUIVALENT_VALUE:
    'MoneyAccountBalanceService:getMusdEquivalentValue',
  GET_EXCHANGE_RATE: 'MoneyAccountBalanceService:getExchangeRate',
  GET_MONEY_ACCOUNT_BALANCE:
    'MoneyAccountBalanceService:getMoneyAccountBalance',
  FETCH_BALANCE_WITH_FALLBACK:
    'MoneyAccountBalanceService:fetchBalanceWithFallback',
} as const satisfies Record<
  string,
  MoneyAccountBalanceServiceQueryAction['type']
>;

export const MoneyAccountApiDataServiceQueryKeys = {
  FETCH_POSITIONS: 'MoneyAccountApiDataService:fetchPositions',
  FETCH_INTEREST: 'MoneyAccountApiDataService:fetchInterest',
} as const satisfies Record<
  string,
  MoneyAccountApiDataServiceQueryAction['type']
>;
