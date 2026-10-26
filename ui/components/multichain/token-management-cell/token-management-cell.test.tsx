import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';

import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { TokenManagementCell } from './token-management-cell';

const mockStore = configureMockStore()({
  metamask: {
    theme: 'light',
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
      },
    },
  },
});

const renderCell = (props: React.ComponentProps<typeof TokenManagementCell>) =>
  renderWithProvider(<TokenManagementCell {...props} />, mockStore);

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
      chainId: '0x1',
      assetId: '0x0000000000000000000000000000000000000001',
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

    expect(
      screen.getByText(messages.networkNameEthereum.message),
    ).toBeInTheDocument();
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
    fireEvent.keyDown(toggleInput.closest('.toggle-button') as HTMLElement, {
      key: 'Enter',
    });

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders the verified badge for a Verified safety result', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      safetyResult: 'Verified',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(
      screen.getByLabelText(messages.securityTrustVerified.message),
    ).toBeInTheDocument();
  });

  it('renders the risky badge for a Warning safety result', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      safetyResult: 'Warning',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(
      screen.getByText(messages.securityTrustRisky.message),
    ).toBeInTheDocument();
  });

  it('renders the malicious badge for a Malicious safety result', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      safetyResult: 'Malicious',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(
      screen.getByText(messages.securityTrustMalicious.message),
    ).toBeInTheDocument();
  });

  it('renders no badge for a Benign result', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      safetyResult: 'Benign',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(screen.queryByTestId('security-badge')).not.toBeInTheDocument();
  });

  it('renders no badge when there is no security data', () => {
    renderCell({
      symbol: 'MUSD',
      primaryLabel: 'MetaMask USD',
      isOn: true,
      onToggle: jest.fn(),
      testIdSuffix: 'musd',
    });

    expect(screen.queryByTestId('security-badge')).not.toBeInTheDocument();
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
