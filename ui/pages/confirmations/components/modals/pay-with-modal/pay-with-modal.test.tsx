import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { getAvailableTokens } from '../../../utils/transaction-pay';
import { PayWithModal } from './pay-with-modal';

jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../utils/transaction-pay');

jest.mock('../../send/asset', () => ({
  Asset: ({
    onAssetSelect,
    tokenFilter,
    hideNfts,
    includeNoBalance,
  }: {
    onAssetSelect?: (token: {
      address: string;
      chainId: string;
      disabled?: boolean;
    }) => void;
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
      </div>
    );
  },
}));

const CHAIN_ID_MOCK = '0x1';

describe('PayWithModal', () => {
  const setPayTokenMock = jest.fn();
  const onCloseMock = jest.fn();
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const getAvailableTokensMock = jest.mocked(getAvailableTokens);

  beforeEach(() => {
    jest.resetAllMocks();

    getAvailableTokensMock.mockImplementation(({ tokens }) => tokens as never);
    useTransactionPayRequiredTokensMock.mockReturnValue([]);

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
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

    expect(screen.getByText('Pay with')).toBeInTheDocument();
  });

  it('renders Asset component with correct props', () => {
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

    expect(screen.getByTestId('asset-component')).toBeInTheDocument();
    expect(screen.getByTestId('hide-nfts')).toHaveTextContent('true');
    expect(screen.getByTestId('include-no-balance')).toHaveTextContent('true');
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls setPayToken and closes modal when token is selected', () => {
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

    const selectButton = screen.getByTestId('select-token');
    fireEvent.click(selectButton);

    expect(setPayTokenMock).toHaveBeenCalledWith({
      address: '0x123',
      chainId: '0x1',
    });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('filters tokens using getAvailableTokens', () => {
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

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
    renderWithProvider(<PayWithModal isOpen={false} onClose={onCloseMock} />);

    expect(screen.queryByText('Pay with')).not.toBeInTheDocument();
  });

  it('does not call setPayToken when disabled token is selected', () => {
    renderWithProvider(<PayWithModal isOpen={true} onClose={onCloseMock} />);

    const selectDisabledButton = screen.getByTestId('select-disabled-token');
    fireEvent.click(selectDisabledButton);

    expect(setPayTokenMock).not.toHaveBeenCalled();
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
