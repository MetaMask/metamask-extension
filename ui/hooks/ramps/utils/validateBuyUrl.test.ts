import { validateBuyWidgetUrl } from './validateBuyUrl';

const VALID_LEGACY_URL =
  'https://on-ramp.api.cx.metamask.io/providers/paypal/buy-widget?regionId=%2Fregions%2Fus-nj&paymentMethodId=%2Fpayments%2Fpaypal&cryptoCurrencyId=%2Fcurrencies%2Fcrypto%2F137%2F0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&fiatCurrencyId=%2Fcurrencies%2Ffiat%2Fusd&amount=100&walletAddress=0x1234567890abcdef1234567890abcdef12345678&redirectUrl=https%3A%2F%2Fon-ramp-content.api.cx.metamask.io%2Fregions%2Ffake-callback&sdk=2.1.6&controller=22.0.0&context=extension';

const VALID_CANONICAL_URL =
  'https://on-ramp.api.cx.metamask.io/providers/paypal/buy-widget?regionId=us-nj&paymentMethodId=paypal&cryptoCurrencyId=137%2F0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&fiatCurrencyId=usd&amount=100&walletAddress=0x1234567890abcdef1234567890abcdef12345678&redirectUrl=https%3A%2F%2Fon-ramp-content.api.cx.metamask.io%2Fregions%2Ffake-callback&sdk=2.1.6&controller=22.0.0&context=extension';

// The mangled buyURL from TRAM-3947: a bare `%` glued the encoded callback
// fragment onto the cryptoCurrencyId value, and every param after it was lost.
const TRAM_3947_MANGLED_URL =
  'https://on-ramp.api.cx.metamask.io/providers/paypal/buy-widget?regionId=us-nj&paymentMethodId=paypal&cryptoCurrencyId=137%ramp-content.api.cx.metamask.io%2Fregions%2Ffake-callback&sdk=2.1.6&controller=15.0.0&context=extension';

function urlWithMissingParam(url: string, param: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete(param);
  return parsed.toString();
}

describe('validateBuyWidgetUrl', () => {
  it('accepts a legacy-encoded buy URL', () => {
    expect(validateBuyWidgetUrl(VALID_LEGACY_URL)).toStrictEqual({
      isValid: true,
    });
  });

  it('accepts a canonical short-form buy URL', () => {
    expect(validateBuyWidgetUrl(VALID_CANONICAL_URL)).toStrictEqual({
      isValid: true,
    });
  });

  it('accepts a local development buy URL', () => {
    const localUrl = VALID_LEGACY_URL.replace(
      'https://on-ramp.api.cx.metamask.io',
      'http://localhost:3000',
    );
    expect(validateBuyWidgetUrl(localUrl)).toStrictEqual({
      isValid: true,
    });
  });

  it('rejects the TRAM-3947 mangled URL with a bare percent escape', () => {
    expect(validateBuyWidgetUrl(TRAM_3947_MANGLED_URL)).toStrictEqual({
      isValid: false,
      reason: 'invalid-encoding',
    });
  });

  it('rejects a URL containing a raw newline', () => {
    const rawTemplateUrl = `${VALID_LEGACY_URL.slice(0, 80)}\n${VALID_LEGACY_URL.slice(80)}`;
    expect(validateBuyWidgetUrl(rawTemplateUrl)).toStrictEqual({
      isValid: false,
      reason: 'invalid-characters',
    });
  });

  it('rejects a URL containing a raw space', () => {
    expect(validateBuyWidgetUrl(`${VALID_LEGACY_URL} extra`)).toStrictEqual({
      isValid: false,
      reason: 'invalid-characters',
    });
  });

  it('rejects a URL on a non-ramps host', () => {
    const parsed = new URL(VALID_LEGACY_URL);
    parsed.host = 'evil.example.com';
    expect(validateBuyWidgetUrl(parsed.toString())).toStrictEqual({
      isValid: false,
      reason: 'untrusted-host',
    });
  });

  it('rejects a URL missing cryptoCurrencyId', () => {
    expect(
      validateBuyWidgetUrl(
        urlWithMissingParam(VALID_LEGACY_URL, 'cryptoCurrencyId'),
      ),
    ).toStrictEqual({
      isValid: false,
      reason: 'missing-params',
    });
  });

  it('rejects a URL missing redirectUrl', () => {
    expect(
      validateBuyWidgetUrl(
        urlWithMissingParam(VALID_LEGACY_URL, 'redirectUrl'),
      ),
    ).toStrictEqual({
      isValid: false,
      reason: 'missing-params',
    });
  });

  it('rejects a URL with an empty cryptoCurrencyId', () => {
    const parsed = new URL(VALID_LEGACY_URL);
    parsed.searchParams.set('cryptoCurrencyId', '');
    expect(validateBuyWidgetUrl(parsed.toString())).toStrictEqual({
      isValid: false,
      reason: 'missing-params',
    });
  });

  it('rejects an empty string', () => {
    expect(validateBuyWidgetUrl('')).toStrictEqual({
      isValid: false,
      reason: 'missing',
    });
  });

  it('rejects undefined', () => {
    expect(validateBuyWidgetUrl(undefined)).toStrictEqual({
      isValid: false,
      reason: 'missing',
    });
  });

  it('rejects a string that is not a URL', () => {
    expect(validateBuyWidgetUrl('not-a-url')).toStrictEqual({
      isValid: false,
      reason: 'unparseable',
    });
  });
});
