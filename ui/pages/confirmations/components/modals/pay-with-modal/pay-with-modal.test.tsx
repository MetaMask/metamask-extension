import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { getAvailableTokens } from '../../../utils/transaction-pay';
import {
  useMusdConversionTokens,
  useMusdPaymentToken,
} from '../../../../../hooks/musd';
import { useConfirmContext } from '../../../context/confirm';
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { PayWithModal } from './pay-with-modal';

jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../utils/transaction-pay');
jest.mock('../../../../../hooks/musd');
jest.mock('../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../../../../store/actions', () => ({
  addToken: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

// Zero-balance non-native token used to exercise the perpsWithdraw addToken
// import branch.
const PERPS_WITHDRAW_TOKEN = {
  address: '0xaaa0000000000000000000000000000000000aaa',
  chainId: '0xa4b1',
  isNative: false,
  rawBalance: '0x0',
  symbol: 'BNB',
  decimals: 18,
  image: './bnb.png',
};

jest.mock('../../send/asset', () => ({
  Asset: ({
    onAssetSelect,
    tokenFilter,
    hideNfts,
    includeNoBalance,
  }: {
    onAssetSelect?: (token: Record<string, unknown>) => void;
    tokenFilter?: (tokens: unknown[]) => unknown[];
    hideNfts?: boolean;
    includeNoBalance?: boolean;
  }) => {
    if (tokenFilter) {
      tokenFilter([]);
    }

    return (
      <div data-testid="asset-component">
        <span data-testid="hide-nfts">{String(hideNfts)}</span>
        <span data-testid="include-no-balance">{String(includeNoBalance)}</span>
        <button
          data-testid="select-token"
          onClick={() => onAssetSelect?.({ address: '0x123', chainId: '0x1' })}
        >
          Select Token
        </button>
        <button
          data-testid="select-disabled-token"
          onClick={() =>
            onAssetSelect?.({
              address: '0x456',
              chainId: '0x1',
              disabled: true,
            })
          }
        >
          Select Disabled Token
        </button>
        <button
          data-testid="select-perps-withdraw-token"
          onClick={() => onAssetSelect?.(PERPS_WITHDRAW_TOKEN)}
        >
          Select Perps Withdraw Token
        </button>
      </div>
    );
  },
}));

const CHAIN_ID_MOCK = '0x1';

// `PayWithModal` calls `useDispatch()` for the perpsWithdraw `addToken`
// import path, so the component needs a redux store at render time. The
// non-perpsWithdraw test cases never actually dispatch — a default mock-state
// store is enough to satisfy the hook.
const renderModal = (props: { isOpen: boolean; onClose: () => void }) =>
  renderWithProvider(<PayWithModal {...props} />, configureStore(mockState));

describe('PayWithModal', () => {
  const setPayTokenMock = jest.fn();
  const onMusdPaymentTokenChangeMock = jest.fn();
  const onCloseMock = jest.fn();
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const getAvailableTokensMock = jest.mocked(getAvailableTokens);
  const useMusdConversionTokensMock = jest.mocked(useMusdConversionTokens);
  const useMusdPaymentTokenMock = jest.mocked(useMusdPaymentToken);
  const useConfirmContextMock = jest.mocked(useConfirmContext);

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {},
    } as ReturnType<typeof useConfirmContext>);

    getAvailableTokensMock.mockImplementation(({ tokens }) => tokens as never);
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    useMusdConversionTokensMock.mockReturnValue({
      filterTokens: (tokens) => tokens,
      filterAllowedTokens: (tokens) => tokens,
      isConversionToken: () => false,
      isMusdSupportedOnChain: () => false,
      hasConvertibleTokensByChainId: () => false,
      tokens: [],
      defaultPaymentToken: null,
    });

    useMusdPaymentTokenMock.mockReturnValue({
      onPaymentTokenChange: onMusdPaymentTokenChangeMock,
      isReplacing: false,
    });

    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: CHAIN_ID_MOCK,
        balanceFiat: '$100.00',
        balanceHuman: '0.05',
        balanceRaw: '50000000000000000',
        balanceUsd: '100.00',
        decimals: 18,
        symbol: 'ETH',
      },
      setPayToken: setPayTokenMock,
      isNative: true,
    });
  });

  it('renders modal with header', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    expect(
      screen.getByText(messages.payWithModalTitle.message),
    ).toBeInTheDocument();
  });

  it('renders Asset component with correct props', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    expect(screen.getByTestId('asset-component')).toBeInTheDocument();
    expect(screen.getByTestId('hide-nfts')).toHaveTextContent('true');
    expect(screen.getByTestId('include-no-balance')).toHaveTextContent('true');
  });

  it('calls onClose when close button is clicked', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    const closeButton = screen.getByLabelText(messages.close.message);
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls setPayToken and closes modal when token is selected', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    const selectButton = screen.getByTestId('select-token');
    fireEvent.click(selectButton);

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: '0x123',
      chainId: '0x1',
    });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('filters tokens using getAvailableTokens with payToken and requiredTokens', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    expect(getAvailableTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payToken: expect.objectContaining({
          address: '0x0000000000000000000000000000000000000000',
          chainId: CHAIN_ID_MOCK,
        }),
        requiredTokens: [],
      }),
    );
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false, onClose: onCloseMock });

    expect(
      screen.queryByText(messages.payWith.message),
    ).not.toBeInTheDocument();
  });

  it('does not call setPayToken when disabled token is selected', () => {
    renderModal({ isOpen: true, onClose: onCloseMock });

    const selectDisabledButton = screen.getByTestId('select-disabled-token');
    fireEvent.click(selectDisabledButton);

    expect(setPayTokenMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  describe('mUSD conversion token selection', () => {
    beforeEach(() => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          type: TransactionType.musdConversion,
        },
      } as ReturnType<typeof useConfirmContext>);
    });

    it('calls onMusdPaymentTokenChange instead of setPayToken for mUSD conversions', () => {
      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-token'));

      expect(onMusdPaymentTokenChangeMock).toHaveBeenCalledWith({
        address: '0x123',
        chainId: '0x1',
      });
      expect(setPayTokenMock).not.toHaveBeenCalled();
    });

    it('closes modal after mUSD token selection', () => {
      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-token'));

      expect(onCloseMock).toHaveBeenCalled();
    });

    it('does not call onMusdPaymentTokenChange when disabled token is selected', () => {
      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-disabled-token'));

      expect(onMusdPaymentTokenChangeMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('non-mUSD token selection', () => {
    it('calls setPayToken and not onMusdPaymentTokenChange for non-mUSD transactions', () => {
      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-token'));

      expect(setPayTokenMock).toHaveBeenCalledWith({
        address: '0x123',
        chainId: '0x1',
      });
      expect(onMusdPaymentTokenChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('perpsWithdraw destination token import', () => {
    const addTokenMock = jest.mocked(addToken);
    const findNetworkClientIdByChainIdMock = jest.mocked(
      findNetworkClientIdByChainId,
    );

    beforeEach(() => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          type: TransactionType.perpsWithdraw,
        },
      } as ReturnType<typeof useConfirmContext>);

      findNetworkClientIdByChainIdMock.mockResolvedValue('arbitrum-client');
      // `addToken` is a thunk; `dispatch(thunk)` returns whatever the thunk
      // returns. The component awaits the dispatch, so a resolved jest.fn
      // wrapped as a thunk-returning jest.fn is enough.
      addTokenMock.mockReturnValue(jest.fn().mockResolvedValue(undefined));
    });

    it('imports a zero-balance non-native token before calling setPayToken', async () => {
      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-perps-withdraw-token'));

      await waitFor(() => {
        expect(setPayTokenMock).toHaveBeenCalledWith({
          address: PERPS_WITHDRAW_TOKEN.address,
          chainId: PERPS_WITHDRAW_TOKEN.chainId,
        });
      });

      expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(
        PERPS_WITHDRAW_TOKEN.chainId,
      );
      expect(addTokenMock).toHaveBeenCalledWith(
        {
          address: PERPS_WITHDRAW_TOKEN.address,
          symbol: PERPS_WITHDRAW_TOKEN.symbol,
          decimals: PERPS_WITHDRAW_TOKEN.decimals,
          networkClientId: 'arbitrum-client',
          image: PERPS_WITHDRAW_TOKEN.image,
        },
        true,
      );
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('keeps the modal open and skips setPayToken when token import fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      addTokenMock.mockReturnValue(
        jest.fn().mockRejectedValue(new Error('network down')),
      );

      renderModal({ isOpen: true, onClose: onCloseMock });

      fireEvent.click(screen.getByTestId('select-perps-withdraw-token'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to import withdraw destination token',
          expect.any(Error),
        );
      });

      expect(setPayTokenMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
