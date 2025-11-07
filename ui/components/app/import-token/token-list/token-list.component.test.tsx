import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen } from '@testing-library/react';
import * as bridgeControllerModule from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as assetUtilsModule from '../../../../../shared/lib/asset-utils';
import * as utilModule from '../../../../helpers/utils/util';
import TokenList from './token-list.component';

jest.mock('@metamask/bridge-controller');
jest.mock('../../../../../shared/lib/asset-utils');
jest.mock('../../../../helpers/utils/util');

describe('TokenList Component', () => {
  const mockStore = configureMockStore()(mockState);
  const mockAccountAddress = '0x1234567890123456789012345678901234567890';

  const defaultProps = {
    results: [],
    selectedTokens: {},
    onToggleToken: jest.fn(),
    allTokens: {},
    currentNetwork: { chainId: '0x1', nickname: 'Ethereum Mainnet' },
    testNetworkBackgroundColor: {},
    accountAddress: mockAccountAddress,
    accountsAssets: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when token is on a non-EVM chain', () => {
    const mockNonEvmToken = {
      symbol: 'SOL',
      name: 'Solana',
      address: 'SolTokenAddress123',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      iconUrl: 'http://example.com/sol.png',
    };

    it('should check accountsAssets to determine if token is already added', () => {
      const assetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:SolTokenAddress123';

      jest
        .spyOn(bridgeControllerModule, 'isNonEvmChainId')
        .mockReturnValue(true);
      jest.spyOn(assetUtilsModule, 'toAssetId').mockReturnValue(assetId);

      const props = {
        ...defaultProps,
        results: [mockNonEvmToken],
        accountsAssets: {
          [mockAccountAddress]: [assetId],
        },
      };

      renderWithProvider(<TokenList {...props} />, mockStore);

      expect(bridgeControllerModule.isNonEvmChainId).toHaveBeenCalledWith(
        mockNonEvmToken.chainId,
      );
      expect(assetUtilsModule.toAssetId).toHaveBeenCalledWith(
        mockNonEvmToken.address,
        mockNonEvmToken.chainId,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should mark token as not added when assetId is not in accountsAssets', () => {
      const assetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:SolTokenAddress123';

      jest
        .spyOn(bridgeControllerModule, 'isNonEvmChainId')
        .mockReturnValue(true);
      jest.spyOn(assetUtilsModule, 'toAssetId').mockReturnValue(assetId);

      const props = {
        ...defaultProps,
        results: [mockNonEvmToken],
        accountsAssets: {
          [mockAccountAddress]: ['DifferentAssetId'],
        },
      };

      renderWithProvider(<TokenList {...props} />, mockStore);

      expect(assetUtilsModule.toAssetId).toHaveBeenCalled();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('when token is on an EVM chain', () => {
    const mockEvmToken = {
      symbol: 'DAI',
      name: 'Dai',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      chainId: '0x1',
      iconUrl: 'http://example.com/dai.png',
    };

    it('should use checkExistingAllTokens to determine if token is already added', () => {
      jest
        .spyOn(bridgeControllerModule, 'isNonEvmChainId')
        .mockReturnValue(false);
      jest.spyOn(utilModule, 'checkExistingAllTokens').mockReturnValue(false);

      const props = {
        ...defaultProps,
        results: [mockEvmToken],
      };

      renderWithProvider(<TokenList {...props} />, mockStore);

      expect(bridgeControllerModule.isNonEvmChainId).toHaveBeenCalledWith(
        mockEvmToken.chainId,
      );
      expect(utilModule.checkExistingAllTokens).toHaveBeenCalledWith(
        mockEvmToken.address,
        mockEvmToken.chainId,
        mockAccountAddress,
        props.allTokens,
      );
      expect(assetUtilsModule.toAssetId).not.toHaveBeenCalled();
    });
  });
});
