import React from 'react';
import { render, screen } from '@testing-library/react';
import { NameType } from '@metamask/name-controller';
import { TokenStandard } from '../../../../shared/constants/transaction';
import Name from '../name';
import { AssetPill } from './asset-pill';
import { NativeAssetIdentifier, TokenAssetIdentifier } from './types';

jest.mock('../name', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('AssetPill', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders EthAssetPill when asset native', () => {
    const asset: NativeAssetIdentifier = { standard: TokenStandard.none };

    render(<AssetPill asset={asset} />);

    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('renders Name component with correct props when asset standard is not none', () => {
    const asset: TokenAssetIdentifier = {
      standard: TokenStandard.ERC20,
      address: '0x1234567890123456789012345678901234567890',
    };

    render(<AssetPill asset={asset} />);

    expect(Name).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NameType.ETHEREUM_ADDRESS,
        value: asset.address,
        preferContractSymbol: true,
      }),
      {},
    );
  });
});
