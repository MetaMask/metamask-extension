import { renderHook } from '@testing-library/react-hooks';
import { KnownCaipNamespace } from '@metamask/utils';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../shared/modules/selectors/multichain', () => ({
  getEnabledNetworks: jest.fn(),
}));

jest.mock('../../components/app/musd/constants', () => ({
  MUSD_BUYABLE_CHAIN_IDS: ['0x1', '0xe708'],
}));

const { useSelector } = jest.requireMock('react-redux');

function setupNetworks(evmNetworks: Record<string, boolean> = {}) {
  useSelector.mockReturnValue({
    [KnownCaipNamespace.Eip155]: evmNetworks,
  });
}

describe('useMusdNetworkFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enabledChainIds', () => {
    it('extracts enabled chain IDs from the EVM namespace', () => {
      setupNetworks({ '0x1': true, '0xe708': true, '0x89': false });

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.enabledChainIds).toEqual(
        expect.arrayContaining(['0x1', '0xe708']),
      );
      expect(result.current.enabledChainIds).not.toContain('0x89');
    });

    it('returns empty array when no chains are enabled', () => {
      setupNetworks({});

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.enabledChainIds).toEqual([]);
    });

    it('handles missing EVM namespace gracefully', () => {
      useSelector.mockReturnValue({});

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.enabledChainIds).toEqual([]);
    });

    it('handles null enabledNetworkMap', () => {
      useSelector.mockReturnValue(null);

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.enabledChainIds).toEqual([]);
    });
  });

  describe('isPopularNetworksFilterActive', () => {
    it('returns true when multiple chains are enabled', () => {
      setupNetworks({ '0x1': true, '0xe708': true });

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.isPopularNetworksFilterActive).toBe(true);
    });

    it('returns false when exactly one chain is enabled', () => {
      setupNetworks({ '0x1': true });

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.isPopularNetworksFilterActive).toBe(false);
    });

    it('returns false when no chains are enabled', () => {
      setupNetworks({});

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.isPopularNetworksFilterActive).toBe(false);
    });
  });

  describe('selectedChainId', () => {
    it('returns the chain ID when exactly one chain is enabled', () => {
      setupNetworks({ '0x1': true });

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.selectedChainId).toBe('0x1');
    });

    it('returns null when multiple chains are enabled', () => {
      setupNetworks({ '0x1': true, '0xe708': true });

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.selectedChainId).toBeNull();
    });

    it('returns null when no chains are enabled', () => {
      setupNetworks({});

      const { result } = renderHook(() => useMusdNetworkFilter());

      expect(result.current.selectedChainId).toBeNull();
    });
  });
});
