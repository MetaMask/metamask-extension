import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, render, screen } from '@testing-library/react';

import { TokenManagementCell } from './token-management-cell';

const mockStore = configureMockStore()({
  metamask: {
    theme: 'light',
  },
});

const renderCell = (
  props: React.ComponentProps<typeof TokenManagementCell>,
) =>
  render(
    <Provider store={mockStore}>
      <TokenManagementCell {...props} />
    </Provider>,
  );

describe('TokenManagementCell', () => {
  it('renders the primary and secondary labels', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      secondaryLabel: '200.23 mUSD',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(screen.getByText('MetaMask USD')).toBeInTheDocument();
    expect(screen.getByText('200.23 mUSD')).toBeInTheDocument();
  });

  it('renders a network badge when network metadata is provided', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      networkImage: './images/eth_logo.svg',
      networkName: 'Ethereum Mainnet',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(
      screen.getByTestId('token-management-cell-musd-network-badge'),
    ).toBeInTheDocument();
  });

  it('omits the secondary label when not provided', () => {
    renderCell({
      symbol: 'ETH',
      primaryLabel: 'Ethereum',
      isOn: false,
      onToggle: jest.fn(),
    });

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.queryByText('200.23 mUSD')).not.toBeInTheDocument();
  });

  it('invokes onToggle with the next desired value when the toggle is clicked', () => {
    const onToggle = jest.fn();
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      isOn: true,
      onToggle,
      testIdSuffix: 'musd',
    });

    const toggleInput = screen.getByTestId(
      'token-management-cell-musd-toggle',
    ) as HTMLInputElement;

    fireEvent.click(toggleInput);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('does not invoke onToggle when disabled', () => {
    const onToggle = jest.fn();
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      isOn: true,
      disabled: true,
      onToggle,
      testIdSuffix: 'musd',
    });

    const toggleInput = screen.getByTestId(
      'token-management-cell-musd-toggle',
    ) as HTMLInputElement;

    fireEvent.click(toggleInput);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('omits the toggle when showToggle is false', () => {
    renderCell({
      symbol: 'ETH',
      primaryLabel: 'Ethereum',
      isOn: true,
      onToggle: jest.fn(),
      showToggle: false,
      testIdSuffix: 'eth',
    });

    expect(
      screen.queryByTestId('token-management-cell-eth-toggle'),
    ).not.toBeInTheDocument();
  });
});
