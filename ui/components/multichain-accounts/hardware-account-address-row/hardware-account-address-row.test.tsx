import React from 'react';
import { render, screen } from '@testing-library/react';
import { ETH_TOKEN_IMAGE_URL } from '../../../../shared/constants/network';
import type { HardwareWalletAccountAddress } from './hardware-account-address-row.types';
import { HardwareAccountAddressRow } from './hardware-account-address-row';

const renderWithProviders = (ui: React.ReactElement) => render(<div>{ui}</div>);

describe('HardwareAccountAddressRow', () => {
  const baseAddress: HardwareWalletAccountAddress = {
    id: 'eth-0',
    networkName: 'Ethereum',
    address: '0x091234567890123456789012345678901234b272',
    balance: '$120.00',
    iconUrl: ETH_TOKEN_IMAGE_URL,
    iconType: 'network',
  };

  it('renders network address details', () => {
    renderWithProviders(<HardwareAccountAddressRow address={baseAddress} />);

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('0x091...b272')).toBeInTheDocument();
  });

  it('renders token avatar and address type badge when provided', () => {
    renderWithProviders(
      <HardwareAccountAddressRow
        address={{
          ...baseAddress,
          networkName: 'Bitcoin',
          iconType: 'token',
          addressType: 'Taproot',
        }}
      />,
    );

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Taproot')).toBeInTheDocument();
  });

  it('defaults to network avatar when icon type is omitted', () => {
    renderWithProviders(
      <HardwareAccountAddressRow
        address={{
          ...baseAddress,
          iconType: undefined,
        }}
      />,
    );

    expect(
      screen.getByTestId('hardware-account-address-row'),
    ).toBeInTheDocument();
  });
});
