import React from 'react';
import { render, screen } from '@testing-library/react';
import { NameType } from '@metamask/name-controller';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import Name from '../../../../components/app/name';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { AvatarNetwork } from '../../../../components/component-library/avatar-network';
import { mockNetworkState } from '../../../../../test/stub/networks';
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
          ticker: 'POL',
          imgSrc: './images/pol-token.svg',
        },
      },
    ];

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(cases)(
      'renders chain $chainId',
      ({
        chainId,
        expected,
      }: {
        chainId: (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];
        expected: { ticker: string; imgSrc: string };
      }) => {
        const store = configureStore({
          metamask: {
            ...mockNetworkState({ chainId }),
          },
        });

        renderWithProvider(
          <AssetPill asset={NATIVE_ASSET_IDENTIFIER} />,
          store,
        );

        expect(screen.getByText(expected.ticker)).toBeInTheDocument();

        expect(AvatarNetwork).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expected.ticker,
            src: expected.imgSrc,
          }),
          {},
        );
      },
    );
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
