import React from 'react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  formatAddressToAssetId,
  QuoteResponse,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesNativeErc20 from '../../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { DummyQuotesNoApproval } from '../../../../../test/data/bridge/dummy-quotes';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import { HardwareWalletProvider } from '../../../../contexts/hardware-wallets/HardwareWalletContext';
import * as useSubmitBridgeTransactionModule from '../../hooks/useSubmitBridgeTransaction';
import * as bridgeSelectors from '../../../../ducks/bridge/selectors';
import { BridgeAlert } from '../types';
import { BridgeAlertModal } from './bridge-alert-modal';

const mockOnClose = jest.fn();
const mockSubmitBridgeTransaction = jest.fn();

jest.mock('../../hooks/useSubmitBridgeTransaction', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    submitBridgeTransaction: () => mockSubmitBridgeTransaction(),
    isSubmitting: false,
  })),
}));

const renderModal = (
  variant: 'submit-cta' | 'alert-details' | undefined = undefined,
  priceImpact: string = '0.05',
  stateOverrides = {},
  quotes: QuoteResponse[] = mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
  alertId: BridgeAlert['id'] | undefined = undefined,
) => {
  const toToken = {
    ...quotes[0].quote.destAsset,
    assetId: formatAddressToAssetId(
      quotes[0].quote.destAsset.address,
      quotes[0].quote.destChainId,
    ),
  };
  const mockStore = configureStore(
    createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: quotes.map((quote) => ({
          ...quote,
          quote: {
            ...quote.quote,
            priceData: { ...quote.quote.priceData, priceImpact },
            srcAsset: {
              ...quote.quote.srcAsset,
              assetId: formatAddressToAssetId(
                quote.quote.srcAsset.address,
                quote.quote.srcChainId,
              ),
            },
            destAsset: toToken,
          },
        })) as unknown as QuoteResponse[],
        quoteRequest: {
          srcChainId: 10,
          srcTokenAddress: zeroAddress(),
          destChainId: 42161,
          destTokenAddress: zeroAddress(),
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toToken,
      },
      ...stateOverrides,
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
    const { baseElement } = renderModal();
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
        'submit-cta',
        '0.9',
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
        const { baseElement } = renderModal('submit-cta', priceImpact);
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
      const { baseElement, getByRole, getAllByRole } = renderModal(
        'submit-cta',
        '0.9',
      );
      expect(baseElement).toMatchSnapshot();
      expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
        '',
        'ProceedLoading',
        'Cancel',
      ]);
      expect(getByRole('button', { name: 'Proceed Loading' })).toBeDisabled();
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
      ['', 'warning', '0.07', {}, undefined],
      [
        '',
        'error',
        '0.27',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {},
          },
        },
        undefined,
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
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB as never,
      ],
      [
        '',
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
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB as never,
      ],
    ])(
      'should render%s when there is a price impact %s: %s',
      async (
        _: string,
        _condition: string,
        priceImpact: string | undefined,
        stateOverrides?: Record<string, unknown>,
        quotes?: never[],
      ) => {
        const { baseElement, getByRole, getAllByRole, queryByTestId } =
          renderModal(
            'alert-details',
            priceImpact,
            stateOverrides,
            quotes,
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
        const { baseElement } = renderModal('alert-details', priceImpact);
        expect(baseElement).toMatchSnapshot();
      },
    );
  });

  describe('price-data-unavailable', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(bridgeSelectors, 'getActiveQuotePriceData')
        .mockReturnValue(undefined as never);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('renders "No price information" title and "Proceed" button when activeQuotePriceData is absent', async () => {
      const { getByTestId, getAllByRole } = renderModal('submit-cta');

      expect(getAllByRole('button').map((b) => b.textContent)).toStrictEqual([
        '',
        messages.proceed.message,
        messages.cancel.message,
      ]);
      expect(getByTestId('bridge-alert-modal-proceed-button')).toBeEnabled();
      expect(getByTestId('bridge-alert-modal-cancel-button')).toBeEnabled();
    });

    it('submits the transaction when "Proceed" is clicked', async () => {
      const { getByTestId } = renderModal('submit-cta');

      await act(async () => {
        await userEvent.click(getByTestId('bridge-alert-modal-proceed-button'));
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
    });

    it('does not open when activeQuotePriceData is present', () => {
      jest.restoreAllMocks(); // restore early so real selector runs for this test
      const { baseElement } = renderModal('submit-cta', '0.05');
      expect(baseElement).toMatchSnapshot();
    });
  });

  describe('fiat alert banner', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('shows the fiat loss banner when isPriceImpactError is true and fiat amount is available', () => {
      const { getByTestId } = renderModal(
        'submit-cta',
        '0.9',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {
              ETH: { conversionRate: 2524.25, usdConversionRate: 2524.25 },
            },
          },
        },
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB as never,
      );
      expect(
        getByTestId('bridge-alert-modal-banner').textContent,
      ).toMatchInlineSnapshot(`"You will lose $0.07 on this trade"`);
      expect(getByTestId('bridge-alert-modal-proceed-button')).toBeEnabled();
    });

    it('does not show the fiat loss banner when isPriceImpactError is false (warning)', () => {
      const { queryByTestId } = renderModal(
        'alert-details',
        '0.07',
        {
          metamaskStateOverrides: {
            currentCurrency: 'usd',
            currencyRates: {
              ETH: { conversionRate: 2524.25, usdConversionRate: 2524.25 },
            },
          },
        },
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB as never,
      );
      expect(
        queryByTestId('bridge-alert-modal-banner'),
      ).not.toBeInTheDocument();
    });

    it('does not show the fiat loss banner when fiat amount is unavailable (no exchange rates)', () => {
      const { queryByTestId } = renderModal('submit-cta', '0.9', {
        metamaskStateOverrides: {
          currentCurrency: 'usd',
          currencyRates: {},
        },
      });
      expect(
        queryByTestId('bridge-alert-modal-banner'),
      ).not.toBeInTheDocument();
    });
  });
});
