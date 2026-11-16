import { MONEY_DEPOSIT_ROUTE } from './route';
import { moneyAccountDeposit } from './money-account-deposit';

describe('money account deposit deep link route', () => {
  it('has the same pathname as the mobile deeplink', () => {
    expect(moneyAccountDeposit.pathname).toBe('/money-account-deposit');
  });

  it('returns the correct title key', () => {
    expect(moneyAccountDeposit.getTitle(new URLSearchParams())).toBe(
      'deepLink_theMoneyDepositPage',
    );
  });

  it('navigates to the Money deposit bridge', () => {
    const result = moneyAccountDeposit.handler(new URLSearchParams());

    expect(result).toStrictEqual({
      path: MONEY_DEPOSIT_ROUTE,
      query: new URLSearchParams(),
    });
  });

  it('ignores incoming query params', () => {
    const params = new URLSearchParams({ ref: 'extension', foo: 'bar' });
    const result = moneyAccountDeposit.handler(params);

    expect(result).toStrictEqual({
      path: MONEY_DEPOSIT_ROUTE,
      query: new URLSearchParams(),
    });
  });
});
