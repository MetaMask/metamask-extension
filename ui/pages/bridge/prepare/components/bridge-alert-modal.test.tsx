import React from 'react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  formatAddressToAssetId,
  QuoteResponse,
} from '@metamask/bridge-controller';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesNativeErc20 from '../../../../../test/data/bridge/mock-quotes-native-erc20';
import { DummyQuotesNoApproval } from '../../../../../test/data/bridge/dummy-quotes';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import { HardwareWalletProvider } from '../../../../contexts/hardware-wallets/HardwareWalletContext';
import * as useSubmitBridgeTransactionModule from '../../../../hooks/bridge/useSubmitBridgeTransaction';
import * as bridgeSelectors from '../../../../ducks/bridge/selectors';
import { BridgeAlert } from '../types';
import { BridgeAlertModal } from './bridge-alert-modal';

const mockOnClose = jest.fn();
const mockSubmitBridgeTransaction = jest.fn();

jest.mock('../../../../hooks/bridge/useSubmitBridgeTransaction', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    submitBridgeTransaction: () => mockSubmitBridgeTransaction(),
    isSubmitting: false,
  })),
}));

const renderModal = (
  quotes: QuoteResponse[],
  priceImpact: string = '0.05',
  variant?: 'submit-cta' | 'alert-details',
  stateOverrides?: Record<string, unknown>,
  alertId?: BridgeAlert['id'],
) => {
  const toToken = {
    ...quotes[0].quote.destAsset,
    assetId:
      (quotes[0].quote.destAsset.assetId as CaipAssetType) ??
      formatAddressToAssetId(
        quotes[0].quote.destAsset.address,
        quotes[0].quote.destChainId,
      ),
  };
  const fromToken = {
    ...quotes[0].quote.srcAsset,
    assetId:
      (quotes[0].quote.srcAsset.assetId as CaipAssetType) ??
      formatAddressToAssetId(
        quotes[0].quote.srcAsset.address,
        quotes[0].quote.srcChainId,
      ),
  };

  const { bridgeStateOverrides, ...overrides } = stateOverrides ?? {};
  const mockStore = configureStore(
    createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: quotes.map((quote) => ({
          ...quote,
          quote: {
            ...quote.quote,
            priceData: { ...(quote.quote.priceData ?? {}), priceImpact },
            destAsset: toToken,
            srcAsset: fromToken,
          },
        })),
        quoteRequest: {
          srcChainId: parseCaipAssetType(fromToken.assetId).chainId,
          srcTokenAddress: fromToken.assetId,
          destChainId: parseCaipAssetType(toToken.assetId).chainId,
          destTokenAddress: toToken.assetId,
        },
        ...(bridgeStateOverrides ?? {}),
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toToken,
      },
      ...overrides,
    }),
  );

  return renderWithProvider(
    <HardwareWalletProvider>
      <BridgeAlertModal
        isOpen={true}
        alertId={alertId}
        variant={variant}
        onClose={mockOnClose}
      />
    </HardwareWalletProvider>,
    mockStore,
  );
};

describe('BridgeAlertModal', () => {
  it('should not render the component when variant is undefined', () => {
    const { baseElement } = renderModal(mockBridgeQuotesNativeErc20);
    expect(baseElement).toMatchInlineSnapshot(`
      <body>
        <div
          id="popover-content"
        />
        <div />
      </body>
    `);
  });

  describe('submit-cta', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render when there is a price impact error', async () => {
      const { baseElement, getByRole, getAllByRole } = renderModal(
        mockBridgeQuotesNativeErc20,
        '0.9',
        'submit-cta',
        {
          bridgeStateOverrides: {
            assetExchangeRates: {
              'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
                exchangeRate: '2524.259',
                usdExchangeRate: '1',
              },
            },
          },
        },
      );
      expect(baseElement).toMatchSnapshot();
      expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
        '',
        'Proceed',
        'Cancel',
      ]);
      expect(
        getByRole('button', { name: messages.proceed.message }),
      ).toBeEnabled();
      expect(
        getByRole('button', { name: messages.cancel.message }),
      ).toBeEnabled();

      await act(async () => {
        await userEvent.click(
          getByRole('button', { name: messages.proceed.message }),
        );
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
    });

    // @ts-expect-error: each is a valid test function in jest
    it.each([
      '0.001',
      '0.07', // warning
      '0.24', // warning
      '0',
      undefined,
    ])(
      'should not render when there is no price impact error: %s',
      async (priceImpact: string | undefined) => {
        const { baseElement } = renderModal(
          mockBridgeQuotesNativeErc20,
          priceImpact,
          'submit-cta',
        );
        expect(baseElement).toMatchSnapshot();
      },
    );

    it('should disable the submit button when submission is in progress', async () => {
      jest
        .spyOn(useSubmitBridgeTransactionModule, 'default')
        .mockReturnValueOnce({
          submitBridgeTransaction: jest.fn(),
          isSubmitting: true,
        });
      const { baseElement, getByRole, getAllByRole, getByTestId } = renderModal(
        mockBridgeQuotesNativeErc20,
        '0.9',
        'submit-cta',
        {
          bridgeStateOverrides: {
            assetExchangeRates: {
              'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
                exchangeRate: '2524.259',
                usdExchangeRate: '1',
              },
            },
          },
        },
      );
      expect(baseElement).toMatchSnapshot();
      expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
        '',
        'ProceedLoading',
        'Cancel',
      ]);
      expect(getByTestId('bridge-alert-modal-proceed-button')).toBeDisabled();
      expect(
        getByRole('button', { name: messages.cancel.message }),
      ).toBeDisabled();
    });
  });

  describe('quote-card', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(useSubmitBridgeTransactionModule, 'default')
        .mockReturnValueOnce({
          submitBridgeTransaction: jest.fn(),
          isSubmitting: false,
        });
    });

    // @ts-expect-error: each is a valid test function in jest
    it.each([
      [
        ' warning banner (no exchange rates)',
        'warning',
        '0.07',
        {},
        mockBridgeQuotesNativeErc20,
      ],
      [
        ' alert banner',
        'error (no exchange rates)',
        '0.27',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {},
            assetExchangeRates: {},
          },
        },
        mockBridgeQuotesNativeErc20,
      ],
      [
        ' alert banner',
        'error (with exchange rates)',
        '0.27',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {
              ETH: { conversionRate: 2524.25, usdConversionRate: 2524.25 },
            },
          },
        },
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
      ],
      [
        ' warning banner',
        'warning (with exchange rates)',
        '0.07',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {
              ETH: { conversionRate: 2524.25, usdConversionRate: 2524.25 },
            },
          },
        },
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
      ],
    ])(
      'should render%s when there is a price impact %s: %s',
      async (
        _: string,
        _condition: string,
        priceImpact: string,
        stateOverrides: Record<string, unknown>,
        quotes: QuoteResponse[],
      ) => {
        const { baseElement, getByRole, getAllByRole, queryByTestId } =
          renderModal(
            quotes,
            priceImpact,
            'alert-details',
            stateOverrides,
            'price-impact',
          );
        expect(baseElement).toMatchSnapshot();
        expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
          '',
          'Got it',
        ]);
        expect(
          getByRole('button', {
            name: messages.deprecatedNetworkButtonMsg.message,
          }),
        ).toBeEnabled();

        expect(
          queryByTestId('bridge-alert-modal-banner')?.textContent,
        ).toMatchSnapshot('BannerAlert within BridgeAlertModal');
        await act(async () => {
          await userEvent.click(
            getByRole('button', {
              name: messages.deprecatedNetworkButtonMsg.message,
            }),
          );
        });

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(0);
      },
    );

    // @ts-expect-error: each is a valid test function in jest
    it.each(['0.001', '-0.1', undefined, '0'])(
      'should not render when there is no price impact warning or error: %s',
      async (priceImpact: string | undefined) => {
        const { baseElement } = renderModal(
          mockBridgeQuotesNativeErc20,
          priceImpact,
          'alert-details',
        );
        expect(baseElement).toMatchSnapshot();
      },
    );
  });

  describe('price-data-unavailable', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(bridgeSelectors, 'getActiveQuotePriceData')
        .mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('renders "No price information" title and "Proceed" button when activeQuotePriceData is absent', async () => {
      const { getByTestId, getAllByRole } = renderModal(
        mockBridgeQuotesNativeErc20,
        undefined,
        'submit-cta',
      );

      expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
        '',
        messages.proceed.message,
        messages.cancel.message,
      ]);
      expect(getByTestId('bridge-alert-modal-proceed-button')).toBeEnabled();
      expect(getByTestId('bridge-alert-modal-cancel-button')).toBeEnabled();
    });

    it('submits the transaction when "Proceed" is clicked', async () => {
      const { getByTestId } = renderModal(
        mockBridgeQuotesNativeErc20,
        undefined,
        'submit-cta',
      );

      await act(async () => {
        await userEvent.click(getByTestId('bridge-alert-modal-proceed-button'));
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
    });

    it('does not open when activeQuotePriceData is present', () => {
      jest.restoreAllMocks(); // restore early so real selector runs for this test
      const { baseElement } = renderModal(
        mockBridgeQuotesNativeErc20,
        '0.05',
        'submit-cta',
      );
      expect(baseElement).toMatchSnapshot();
    });
  });

  describe('fiat alert banner', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('shows the fiat loss banner when isPriceImpactError is true and fiat amount is available', () => {
      const { getByTestId } = renderModal(
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
        '0.9',
        'submit-cta',
        undefined,
        'price-impact',
      );
      expect(
        getByTestId('bridge-alert-modal-banner').textContent,
      ).toMatchInlineSnapshot(`"You will lose $0.18 on this trade"`);
      expect(getByTestId('bridge-alert-modal-proceed-button')).toBeEnabled();
    });

    it('does not show the fiat loss banner when isPriceImpactError is false (warning)', () => {
      const { queryByTestId } = renderModal(
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
        '0.07',
        'alert-details',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {
              ETH: { conversionRate: 2524.25, usdConversionRate: 2524.25 },
            },
          },
        },
      );
      expect(
        queryByTestId('bridge-alert-modal-banner'),
      ).not.toBeInTheDocument();
    });

    it('does not show the fiat loss banner when fiat amount is unavailable (no exchange rates)', () => {
      const { queryByTestId } = renderModal(
        mockBridgeQuotesNativeErc20,
        '0.9',
        'submit-cta',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {},
          },
        },
      );
      expect(
        queryByTestId('bridge-alert-modal-banner'),
      ).not.toBeInTheDocument();
    });
  });
});
