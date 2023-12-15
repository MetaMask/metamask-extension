import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import useConfirmationNetworkInfo from './useConfirmationNetworkInfo';

describe('useConfirmationNetworkInfo', () => {
  it('should use chainId from confirmation if present', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        confirm: {
          currentConfirmation: { id: '1', chainId: '0x1' },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Ethereum Mainnet');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.png');
  });

  it('should use current network if chainId is not predent in confirmation', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig: {
            chainId: '0x7',
          },
          networkConfigurations: {
            ...mockState.metamask.networkConfigurations,
            testNetworkConfigurationId: {
              rpcUrl: 'https://testrpc.com',
              chainId: '0x7',
              nickname: 'Custom Mainnet RPC',
              type: 'rpc',
              id: 'testNetworkConfigurationId',
              rpcPrefs: {
                imageUrl: './some_image',
              },
            },
          },
        },
        confirm: {
          currentConfirmation: { id: '1', msgParams: {} },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Custom Mainnet RPC');
    expect(result.current.networkImageUrl).toBe('./some_image');
  });

  it('should return empty strings if no matching network is found', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig: {
            chainId: '0x7',
          },
        },
        confirm: {
          currentConfirmation: { id: '1', msgParams: {} },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('');
    expect(result.current.networkImageUrl).toBe('');
  });
});
