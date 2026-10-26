import { MONEY_HOME_ROUTE } from './route';
import { money } from './money';

describe('money deep link route', () => {
  it('has the correct pathname', () => {
    expect(money.pathname).toBe('/money');
  });

  it('returns the correct title key', () => {
    expect(money.getTitle(new URLSearchParams())).toBe('deepLink_theMoneyPage');
  });

  it('navigates to the Money home route with no query params', () => {
    const result = money.handler(new URLSearchParams());

    expect(result).toStrictEqual({
      path: MONEY_HOME_ROUTE,
      query: new URLSearchParams(),
    });
  });

  it('ignores incoming query params', () => {
    const params = new URLSearchParams({ ref: 'extension', foo: 'bar' });
    const result = money.handler(params);

    expect(result).toStrictEqual({
      path: MONEY_HOME_ROUTE,
      query: new URLSearchParams(),
    });
  });
});
