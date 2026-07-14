import {
  findSelectedQuote,
  isTokenStateSettled,
  parseFiatAmount,
  resolveDisplayedQuoteError,
  resolvePaymentMethodLabel,
} from './build-quote';

describe('build-quote utils', () => {
  describe('parseFiatAmount', () => {
    it('matches snapshot for supported amount formats', () => {
      expect({
        integer: parseFiatAmount('100'),
        decimal: parseFiatAmount('12.5'),
        commaDecimal: parseFiatAmount('12,5'),
        invalid: parseFiatAmount('abc'),
      }).toMatchSnapshot();
    });
  });

  describe('isTokenStateSettled', () => {
    it('matches snapshot for settle cases', () => {
      expect({
        noIntent: isTokenStateSettled(undefined, undefined),
        matching: isTokenStateSettled('eip155:1/slip44:60', 'EIP155:1/slip44:60'),
        mismatch: isTokenStateSettled('eip155:1/slip44:60', 'eip155:1/erc20:0x1'),
      }).toMatchSnapshot();
    });
  });

  describe('findSelectedQuote', () => {
    it('matches snapshot for quote selection cases', () => {
      const quotesResponse = {
        success: [{ provider: 'transak' }, { provider: 'moonpay' }],
        error: [],
      };

      expect({
        missingSelection: findSelectedQuote(quotesResponse, null, null),
        found: findSelectedQuote(
          quotesResponse,
          { id: 'transak', name: 'Transak' },
          { id: 'card', name: 'Card' },
        ),
        missingProviderQuote: findSelectedQuote(
          quotesResponse,
          { id: 'unknown', name: 'Unknown' },
          { id: 'card', name: 'Card' },
        ),
      }).toMatchSnapshot();
    });
  });

  describe('resolvePaymentMethodLabel', () => {
    it('matches snapshot for payment method label cases', () => {
      const methods = [
        { id: 'card', name: 'Debit card' },
        { id: 'bank', name: 'Bank transfer' },
      ];

      expect({
        selectedAvailable: resolvePaymentMethodLabel(
          methods,
          { id: 'bank', name: 'Bank transfer' },
          'Select payment method',
        ),
        selectedUnavailable: resolvePaymentMethodLabel(
          methods,
          { id: 'missing', name: 'Missing' },
          'Select payment method',
        ),
        noneSelected: resolvePaymentMethodLabel(
          methods,
          null,
          'Select payment method',
        ),
      }).toMatchSnapshot();
    });
  });

  describe('resolveDisplayedQuoteError', () => {
    it('matches snapshot for displayed quote error cases', () => {
      expect({
        fetchError: resolveDisplayedQuoteError({
          quoteFetchErrorMessage: 'Failed to fetch quote.',
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          hasQuoteFetchError: true,
          quotesResponse: null,
          selectedQuote: null,
        }),
        providerError: resolveDisplayedQuoteError({
          quoteFetchErrorMessage: null,
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          hasQuoteFetchError: false,
          quotesResponse: {
            success: [],
            error: [{ error: 'Minimum purchase is $5 USD' }],
          },
          selectedQuote: null,
        }),
        noError: resolveDisplayedQuoteError({
          quoteFetchErrorMessage: null,
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          hasQuoteFetchError: false,
          quotesResponse: {
            success: [{ provider: 'transak' }],
            error: [],
          },
          selectedQuote: { provider: 'transak' },
        }),
      }).toMatchSnapshot();
    });
  });
});
