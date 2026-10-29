import { act } from '@testing-library/react';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import * as actions from '../../../../../store/actions';
import {
  getSelectableChainId,
  useHomeNetworkFilter,
} from './use-home-network-filter';

describe('useHomeNetworkFilter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleSelectAllDefaultNetworks', () => {
    it('enables all popular networks and calls onClose', () => {
      const setEnabledAllPopularNetworksSpy = jest
        .spyOn(actions, 'setEnabledAllPopularNetworks')
        .mockReturnValue(() => Promise.resolve());
      const onClose = jest.fn();
      const { result } = renderHookWithProvider(
        () => useHomeNetworkFilter({ onClose }),
        mockState,
      );

      act(() => {
        result.current.handleSelectAllDefaultNetworks();
      });

      expect(setEnabledAllPopularNetworksSpy).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSelectableChainId', () => {
    it('returns the hex chain id for an EVM network', () => {
      const network: MultichainNetworkConfiguration = {
        chainId: 'eip155:1',
        isEvm: true,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrls: [],
        defaultBlockExplorerUrlIndex: 0,
      };

      expect(getSelectableChainId(network)).toBe('0x1');
    });

    it('returns the CAIP chain id for a non-EVM network', () => {
      const network: MultichainNetworkConfiguration = {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        isEvm: false,
        name: 'Solana',
        nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      };

      expect(getSelectableChainId(network)).toBe(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
    });
  });
});
