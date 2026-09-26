import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import type { CaipChainId } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { useDeFiListItemsV2 } from './useDeFiListItemsV2';

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value),
  }),
}));

const lidoPosition: DeFiProtocolPositionGroup = {
  protocolId: 'lido',
  productName: 'Lido',
  protocolIconUrl: 'lido.png',
  chainId: 'eip155:1' as CaipChainId,
  marketValue: 20000,
  iconGroup: [{ symbol: 'stETH', avatarValue: 'steth.png' }],
  sections: [],
};

const aavePosition: DeFiProtocolPositionGroup = {
  protocolId: 'aave',
  productName: 'Aave',
  protocolIconUrl: 'aave.png',
  chainId: 'eip155:137' as CaipChainId,
  marketValue: 500,
  iconGroup: [{ symbol: 'USDC', avatarValue: 'usdc.png' }],
  sections: [],
};

const render = ({
  positions = [lidoPosition],
  isLoading = false,
  isError = false,
  enabledNetworks = { eip155: { '0x1': true } },
}: {
  positions?: DeFiProtocolPositionGroup[];
  isLoading?: boolean;
  isError?: boolean;
  enabledNetworks?: Record<string, Record<string, boolean>>;
} = {}) => {
  return renderHookWithProvider(
    () => useDeFiListItemsV2({ positions, isLoading, isError }),
    {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: enabledNetworks,
      },
    },
  );
};

describe('useDeFiListItemsV2', () => {
  it('returns undefined while positions are loading', () => {
    const { result } = render({ isLoading: true });

    expect(result.current).toBeUndefined();
  });

  it('returns null when the fetch fails and nothing is cached', () => {
    const { result } = render({ isError: true, positions: [] });

    expect(result.current).toBeNull();
  });

  it('maps cached rows when a background refresh fails', () => {
    const { result } = render({ isError: true, positions: [lidoPosition] });

    expect(result.current).toEqual([
      expect.objectContaining({
        protocolId: 'lido',
        chainId: 'eip155:1',
        marketValue: '$20,000.00',
      }),
    ]);
  });

  it('returns an empty array when there are no positions', () => {
    const { result } = render({ positions: [] });

    expect(result.current).toEqual([]);
  });

  it('filters rows to enabled networks', () => {
    const { result } = render({
      positions: [lidoPosition, aavePosition],
      enabledNetworks: { eip155: { '0x1': true } },
    });

    expect(result.current).toEqual([
      expect.objectContaining({ protocolId: 'lido' }),
    ]);
  });
});
