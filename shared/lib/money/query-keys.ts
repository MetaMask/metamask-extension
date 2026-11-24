import type {
  MoneyAccountBalanceServiceFetchBalanceWithFallbackAction,
  MoneyAccountBalanceServiceGetExchangeRateAction,
  MoneyAccountBalanceServiceGetMoneyAccountBalanceAction,
  MoneyAccountBalanceServiceGetMusdBalanceAction,
  MoneyAccountBalanceServiceGetMusdEquivalentValueAction,
  MoneyAccountBalanceServiceGetVmusdBalanceAction,
} from '@metamask/money-account-balance-service';
import type {
  MoneyAccountApiDataServiceFetchInterestAction,
  MoneyAccountApiDataServiceFetchPositionsAction,
  MoneyAccountApiDataServiceFetchVaultsAction,
  MoneyAccountApiDataServiceFetchVaultRateAction,
  MoneyAccountApiDataServiceFetchVaultShareValuationsAction,
} from '@metamask/money-account-api-data-service';

type MoneyAccountBalanceServiceQueryAction =
  | MoneyAccountBalanceServiceFetchBalanceWithFallbackAction
  | MoneyAccountBalanceServiceGetExchangeRateAction
  | MoneyAccountBalanceServiceGetMoneyAccountBalanceAction
  | MoneyAccountBalanceServiceGetMusdBalanceAction
  | MoneyAccountBalanceServiceGetMusdEquivalentValueAction
  | MoneyAccountBalanceServiceGetVmusdBalanceAction;

type MoneyAccountApiDataServiceQueryAction =
  | MoneyAccountApiDataServiceFetchInterestAction
  | MoneyAccountApiDataServiceFetchPositionsAction
  | MoneyAccountApiDataServiceFetchVaultsAction
  | MoneyAccountApiDataServiceFetchVaultRateAction
  | MoneyAccountApiDataServiceFetchVaultShareValuationsAction;

export const MoneyAccountBalanceServiceQueryKeys = {
  GET_MUSD_BALANCE: 'MoneyAccountBalanceService:getMusdBalance',
  GET_VMUSD_BALANCE: 'MoneyAccountBalanceService:getVmusdBalance',
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
  FETCH_VAULTS: 'MoneyAccountApiDataService:fetchVaults',
  FETCH_VAULT_RATE: 'MoneyAccountApiDataService:fetchVaultRate',
  FETCH_VAULT_SHARE_VALUATIONS:
    'MoneyAccountApiDataService:fetchVaultShareValuations',
} as const satisfies Record<
  string,
  MoneyAccountApiDataServiceQueryAction['type']
>;
