import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { WalletDetailsAccountTypeSelection } from './wallet-details-account-type-selection';
import { WalletClientType } from '../../../../hooks/accounts/useMultichainWalletSnapClient';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock(
  '../../../../hooks/accounts/useMultichainWalletSnapClient',
  () => ({
    WalletClientType: {
      Bitcoin: 'bitcoin-wallet-snap',
      Solana: 'solana-wallet-snap',
    },
  }),
);

describe('WalletDetailsAccountTypeSelection', () => {
  const onAccountTypeSelect = jest.fn();
  const onClose = jest.fn();

  const mockUseSelector = useSelector as jest.Mock;

  const renderComponent = () =>
    render(
      <WalletDetailsAccountTypeSelection
        onAccountTypeSelect={onAccountTypeSelect}
        onClose={onClose}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(true);
  });

  it('renders correctly with all options when enabled', () => {
    const { getByTestId, getByText } = renderComponent();
    expect(getByText('newAccount')).toBeInTheDocument();
    expect(
      getByTestId('wallet-details-add-ethereum-account'),
    ).toBeInTheDocument();
    expect(
      getByTestId('wallet-details-add-solana-account'),
    ).toBeInTheDocument();
    expect(
      getByTestId('wallet-details-add-bitcoin-account'),
    ).toBeInTheDocument();
  });

  it('calls onAccountTypeSelect with "EVM" when Ethereum button is clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('wallet-details-add-ethereum-account'));
    expect(onAccountTypeSelect).toHaveBeenCalledWith('EVM');
  });

  it('calls onAccountTypeSelect with WalletClientType.Solana when Solana button is clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('wallet-details-add-solana-account'));
    expect(onAccountTypeSelect).toHaveBeenCalledWith(WalletClientType.Solana);
  });

  it('calls onAccountTypeSelect with WalletClientType.Bitcoin when Bitcoin button is clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('wallet-details-add-bitcoin-account'));
    expect(onAccountTypeSelect).toHaveBeenCalledWith(WalletClientType.Bitcoin);
  });

  it('calls onClose when close button is clicked', () => {
    const { getByLabelText } = renderComponent();
    fireEvent.click(getByLabelText('close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render Solana button if not enabled', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector.name !== 'getIsSolanaSupportEnabled',
    );
    const { queryByTestId } = renderComponent();
    expect(
      queryByTestId('wallet-details-add-solana-account'),
    ).not.toBeInTheDocument();
  });

  it('does not render Bitcoin button if not enabled', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector.name !== 'getIsBitcoinSupportEnabled',
    );
    const { queryByTestId } = renderComponent();
    expect(
      queryByTestId('wallet-details-add-bitcoin-account'),
    ).not.toBeInTheDocument();
  });
});