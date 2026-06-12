import React from 'react';
import { render, screen } from '@testing-library/react';
import { tEn } from '../../../../test/lib/i18n-helpers';
import { MOCK_ETHEREUM_HARDWARE_ADDRESS } from '../../../../test/data/hardware-wallet-accounts';
import type { HardwareWalletAccountAddress } from './hardware-account-address-row.types';
import { HardwareAccountAddressRow } from './hardware-account-address-row';

const renderRow = (address: HardwareWalletAccountAddress) =>
  render(<HardwareAccountAddressRow address={address} />);

describe('HardwareAccountAddressRow', () => {
  describe('rendering', () => {
    it('renders network name, truncated address, and balance', () => {
      renderRow(MOCK_ETHEREUM_HARDWARE_ADDRESS);

      expect(screen.getByText(tEn('networkNameEthereum'))).toBeInTheDocument();
      expect(screen.getByText('0x091...b272')).toBeInTheDocument();
      expect(screen.getByText('$120.00')).toBeInTheDocument();
    });

    it('renders address type badge when addressType is provided', () => {
      renderRow({
        ...MOCK_ETHEREUM_HARDWARE_ADDRESS,
        networkName: 'Bitcoin',
        iconType: 'token',
        addressType: 'Taproot',
      });

      expect(screen.getByText(tEn('networkNameBitcoin'))).toBeInTheDocument();
      expect(screen.getByText('Taproot')).toBeInTheDocument();
    });

    it('omits address type badge when addressType is not provided', () => {
      renderRow(MOCK_ETHEREUM_HARDWARE_ADDRESS);

      expect(screen.queryByText('Taproot')).not.toBeInTheDocument();
    });
  });

  describe('avatar', () => {
    it('renders a network avatar when iconType is network', () => {
      renderRow({ ...MOCK_ETHEREUM_HARDWARE_ADDRESS, iconType: 'network' });

      expect(
        screen.getByRole('img', { name: tEn('networkNameEthereum') }),
      ).toBeInTheDocument();
    });

    it('renders a token avatar when iconType is token', () => {
      renderRow({
        ...MOCK_ETHEREUM_HARDWARE_ADDRESS,
        networkName: 'Bitcoin',
        iconType: 'token',
        iconUrl: './images/bitcoin-logo.svg',
      });

      expect(
        screen.getByRole('img', { name: tEn('networkNameBitcoin') }),
      ).toBeInTheDocument();
    });

    it('defaults to a network avatar when iconType is omitted', () => {
      renderRow({ ...MOCK_ETHEREUM_HARDWARE_ADDRESS, iconType: undefined });

      expect(
        screen.getByRole('img', { name: tEn('networkNameEthereum') }),
      ).toBeInTheDocument();
    });
  });
});
