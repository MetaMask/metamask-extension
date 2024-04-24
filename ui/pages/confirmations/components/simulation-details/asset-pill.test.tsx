import React from 'react';
import { render, screen } from '@testing-library/react';
import { NameType } from '@metamask/name-controller';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import Name from '../../../../components/app/name';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { AvatarNetwork } from '../../../../components/component-library/avatar-network';
import { AssetPill } from './asset-pill';
import { NATIVE_ASSET_IDENTIFIER, TokenAssetIdentifier } from './types';

jest.mock('../../../../components/component-library/avatar-network', () => ({
  AvatarNetworkSize: { Sm: 'Sm' },
  AvatarNetwork: jest.fn(() => null),
}));

jest.mock('../../../../components/app/name', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('AssetPill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Native Asset', () => {
    const cases = [
      {
        chainId: CHAIN_IDS.MAINNET,
        expected: {
          ticker: 'ETH',
          imgSrc: './images/eth_logo.svg',
        },
      },
      {
        chainId: CHAIN_IDS.POLYGON,
        expected: {
          ticker: 'MATIC',
          imgSrc: './images/matic-token.svg',
        },
      },
    ];

    it.each(cases)('renders chain $chainId', ({ chainId, expected }) => {
      const store = configureStore({
        metamask: { providerConfig: { chainId, ticker: expected.ticker } },
      });

      renderWithProvider(<AssetPill asset={NATIVE_ASSET_IDENTIFIER} />, store);

      expect(screen.getByText(expected.ticker)).toBeInTheDocument();

      expect(AvatarNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expected.ticker,
          src: expected.imgSrc,
        }),
        {},
      );
    });
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
