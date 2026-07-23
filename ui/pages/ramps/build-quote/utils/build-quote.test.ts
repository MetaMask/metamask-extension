import type { Quote } from '@metamask/ramps-controller';
import {
  findSelectedQuote,
  isTokenStateSettled,
  parseFiatAmount,
  resolveBuildQuoteViewKind,
  resolveCanContinue,
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
        matching: isTokenStateSettled(
          'eip155:1/slip44:60',
          'EIP155:1/slip44:60',
        ),
        mismatch: isTokenStateSettled(
          'eip155:1/slip44:60',
          'eip155:1/erc20:0x1',
        ),
      }).toMatchSnapshot();
    });
  });

  describe('resolveBuildQuoteViewKind', () => {
    it('matches snapshot for loading, redirect, and ready cases', () => {
      const intent = 'eip155:1/slip44:60';
      const matching = 'eip155:1/slip44:60';
      const mismatch = 'eip155:1/erc20:0x1';

      expect({
        noIntentLoadingWithoutToken: resolveBuildQuoteViewKind({
          intentAssetId: undefined,
          selectedTokenAssetId: undefined,
          tokensLoading: true,
        }),
        noIntentReadyWithToken: resolveBuildQuoteViewKind({
          intentAssetId: undefined,
          selectedTokenAssetId: matching,
          tokensLoading: false,
        }),
        noIntentRedirectWithoutToken: resolveBuildQuoteViewKind({
          intentAssetId: undefined,
          selectedTokenAssetId: undefined,
          tokensLoading: false,
        }),
        intentLoadingWithoutToken: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: undefined,
          tokensLoading: true,
        }),
        intentLoadingWithMismatch: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: mismatch,
          tokensLoading: true,
        }),
        intentReadyWhenMatched: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: matching,
          tokensLoading: false,
        }),
        intentReadyWhenMatchedWhileTokensLoading: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: matching,
          tokensLoading: true,
        }),
        // UI store may lag behind background pre-select — keep loading
        intentLoadingWhenLoadFinishedWithoutToken: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: undefined,
          tokensLoading: false,
        }),
        intentLoadingWhenLoadFinishedWithMismatch: resolveBuildQuoteViewKind({
          intentAssetId: intent,
          selectedTokenAssetId: mismatch,
          tokensLoading: false,
        }),
      }).toMatchSnapshot();
    });
  });

  describe('findSelectedQuote', () => {
    it('matches snapshot for quote selection cases', () => {
      const quotesResponse = {
        success: [
          { provider: 'transak' },
          { provider: 'moonpay' },
        ] as unknown as Quote[],
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
            error: [
              { provider: 'transak', error: 'Minimum purchase is $5 USD' },
            ],
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
            success: [{ provider: 'transak' }] as unknown as Quote[],
            error: [],
          },
          selectedQuote: { provider: 'transak' },
        }),
      }).toMatchSnapshot();
    });
  });

  describe('resolveCanContinue', () => {
    it('matches snapshot for continue enablement cases', () => {
      const readyQuote = { provider: 'transak' };

      expect({
        ready: resolveCanContinue({
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          selectedQuote: readyQuote,
          hasQuoteFetchError: false,
        }),
        // Displayed amount still settling through debounce — must disable
        duringDebounce: resolveCanContinue({
          hasAmount: true,
          hasSettledQuoteAmount: false,
          selectedQuoteLoading: false,
          selectedQuote: readyQuote,
          hasQuoteFetchError: false,
        }),
        loadingQuote: resolveCanContinue({
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: true,
          selectedQuote: readyQuote,
          hasQuoteFetchError: false,
        }),
        noQuote: resolveCanContinue({
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          selectedQuote: null,
          hasQuoteFetchError: false,
        }),
        fetchError: resolveCanContinue({
          hasAmount: true,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          selectedQuote: readyQuote,
          hasQuoteFetchError: true,
        }),
        emptyAmount: resolveCanContinue({
          hasAmount: false,
          hasSettledQuoteAmount: true,
          selectedQuoteLoading: false,
          selectedQuote: readyQuote,
          hasQuoteFetchError: false,
        }),
      }).toMatchSnapshot();
    });
  });
});
