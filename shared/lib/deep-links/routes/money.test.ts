import { BaseUrl } from '../../../constants/urls';
import { money } from './money';

describe('money deep link route', () => {
  it('has the correct pathname', () => {
    expect(money.pathname).toBe('/money');
  });

  it('returns the correct title key', () => {
    expect(money.getTitle(new URLSearchParams())).toBe('deepLink_theMoneyPage');
  });

  it('redirects to the MetaMask money page with no query params', () => {
    const result = money.handler(new URLSearchParams());

    expect('redirectTo' in result).toBe(true);

    const { redirectTo } = result as { redirectTo: URL };
    expect(redirectTo.toString()).toBe(`${BaseUrl.MetaMask}/money`);
  });

  it('forwards incoming query params to the redirect URL', () => {
    const params = new URLSearchParams({ ref: 'extension', foo: 'bar' });
    const result = money.handler(params);

    const { redirectTo } = result as { redirectTo: URL };
    expect(redirectTo.searchParams.get('ref')).toBe('extension');
    expect(redirectTo.searchParams.get('foo')).toBe('bar');
  });

  it('preserves the base redirect URL path when query params are present', () => {
    const params = new URLSearchParams({ baz: 'qux' });
    const result = money.handler(params);

    const { redirectTo } = result as { redirectTo: URL };
    expect(redirectTo.pathname).toBe('/money');
    expect(redirectTo.origin).toBe(BaseUrl.MetaMask);
  });
});
