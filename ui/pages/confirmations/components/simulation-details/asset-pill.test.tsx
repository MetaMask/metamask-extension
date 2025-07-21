import React from 'react';
import { screen } from '@testing-library/react';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import Name from '../../../../components/app/name';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { AvatarNetwork } from '../../../../components/component-library/avatar-network';
import { mockNetworkState } from '../../../../../test/stub/networks';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetPill } from './asset-pill';
import { NativeAssetIdentifier, TokenAssetIdentifier } from './types';

jest.mock('../../../../components/component-library/avatar-network', () => ({
  AvatarNetworkSize: { Sm: 'Sm' },
  AvatarNetwork: jest.fn(() => null),
}));

jest.mock('../../../../components/app/name', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => null),
}));

const CHAIN_ID_MOCK = '0x1';

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
            ...mockNetworkState({ chainId: chainId as Hex }),
          },
        });

        const asset: NativeAssetIdentifier = {
          chainId: chainId as Hex,
          standard: TokenStandard.none,
        };

        renderWithProvider(<AssetPill asset={asset} />, store);

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
      chainId: CHAIN_ID_MOCK,
      standard: TokenStandard.ERC20,
      address: '0x1234567890123456789012345678901234567890',
    };

    renderWithProvider(<AssetPill asset={asset} />, configureStore(mockState));

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
