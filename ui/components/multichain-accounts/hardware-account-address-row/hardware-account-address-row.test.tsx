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
    it('renders network name, chain icon, truncated address, and balance', () => {
      renderRow(MOCK_ETHEREUM_HARDWARE_ADDRESS);

      expect(
        screen.getByRole('img', { name: tEn('networkNameEthereum') }),
      ).toBeInTheDocument();
      expect(screen.getByText(tEn('networkNameEthereum'))).toBeInTheDocument();
      expect(screen.getByText('0x091...b272')).toBeInTheDocument();
      expect(screen.getByText('$120.00')).toBeInTheDocument();
    });

    it('renders address type badge when addressType is provided', () => {
      renderRow({
        ...MOCK_ETHEREUM_HARDWARE_ADDRESS,
        networkName: 'Bitcoin',
        iconUrl: './images/bitcoin-logo.svg',
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
});
