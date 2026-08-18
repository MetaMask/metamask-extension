import { MoneyAccountApiDataService } from '@metamask/money-account-api-data-service';
import { MoneyAccountBalanceService } from '@metamask/money-account-balance-service';
import {
  MoneyAccountApiDataServiceQueryKeys,
  MoneyAccountBalanceServiceQueryKeys,
} from './query-keys';

describe('MoneyAccountBalanceServiceQueryKeys', () => {
  it('names the actions the balance service exposes', () => {
    expect(MoneyAccountBalanceServiceQueryKeys).toStrictEqual({
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
    });
  });

  it('is namespaced under the service name', () => {
    // The values are literals rather than `${MoneyAccountBalanceService.name}:`
    // interpolations, since class names are not minification-safe. This catches
    // a service rename in the package, which the type-level `satisfies` check
    // on the registry cannot see.
    for (const queryKey of Object.values(MoneyAccountBalanceServiceQueryKeys)) {
      expect(queryKey.startsWith(`${MoneyAccountBalanceService.name}:`)).toBe(
        true,
      );
    }
  });
});

describe('MoneyAccountApiDataServiceQueryKeys', () => {
  it('names the actions the API data service exposes', () => {
    expect(MoneyAccountApiDataServiceQueryKeys).toStrictEqual({
      FETCH_POSITIONS: 'MoneyAccountApiDataService:fetchPositions',
      FETCH_INTEREST: 'MoneyAccountApiDataService:fetchInterest',
    });
  });

  it('is namespaced under the service name', () => {
    for (const queryKey of Object.values(MoneyAccountApiDataServiceQueryKeys)) {
      expect(queryKey.startsWith(`${MoneyAccountApiDataService.name}:`)).toBe(
        true,
      );
    }
  });
});
