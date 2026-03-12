import React from 'react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteResponse } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import { HardwareWalletProvider } from '../../../contexts/hardware-wallets/HardwareWalletContext';
import * as useSubmitBridgeTransactionModule from '../hooks/useSubmitBridgeTransaction';
import { BridgePriceImpactWarningModal } from './bridge-price-impact-modal';

const mockOnClose = jest.fn();
const mockSubmitBridgeTransaction = jest.fn();

jest.mock('../hooks/useSubmitBridgeTransaction', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    submitBridgeTransaction: () => mockSubmitBridgeTransaction(),
    isSubmitting: false,
  })),
}));

const renderModal = (
  variant: 'submit-cta' | 'quote-card' | null = null,
  priceImpact: string = '0.05',
) => {
  const mockStore = configureStore(
    createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20.map((quote) => ({
          ...quote,
          quote: {
            ...quote.quote,
            priceData: { ...quote.quote.priceData, priceImpact },
          },
        })) as unknown as QuoteResponse[],
      },
    }),
  );
  return renderWithProvider(
    <HardwareWalletProvider>
      <BridgePriceImpactWarningModal variant={variant} onClose={mockOnClose} />
    </HardwareWalletProvider>,
    mockStore,
  );
};
describe('BridgePriceImpactModal', () => {
  it('should not render the component when variant is null', () => {
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
      expect(mockOnClose).toHaveBeenCalledTimes(0);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
    });

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

    it.each([
      '0.07', // warning
      '0.27', // error
    ])(
      'should render when there is a price impact warning or error: %s',
      async (priceImpact: string | undefined) => {
        const { baseElement, getByRole, getAllByRole } = renderModal(
          'quote-card',
          priceImpact,
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

    it.each(['0.001', '-0.1', undefined, '0'])(
      'should not render when there is no price impact warning or error: %s',
      async (priceImpact: string | undefined) => {
        const { baseElement } = renderModal('quote-card', priceImpact);
        expect(baseElement).toMatchSnapshot();
      },
    );
  });
});
