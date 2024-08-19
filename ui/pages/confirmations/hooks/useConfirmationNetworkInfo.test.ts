import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useConfirmationNetworkInfo from './useConfirmationNetworkInfo';

describe('useConfirmationNetworkInfo', () => {
  it('returns display name and image when confirmation chainId is present', () => {
    const providerConfig = {
      chainId: '0x1',
      rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
      ticker: 'ETH',
      type: 'mainnet',
    };
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig,
        },
        confirm: {
          currentConfirmation: { id: '1', chainId: '0x1' },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Ethereum Mainnet');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.svg');
  });

  it('returns display name and image for custom network', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig: {
            chainId: '0x7',
            type: 'rpc',
            id: 'testNetworkConfigurationId',
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

  it('returns correct details about custom network whose chainId is same as a network pre-defined in extension', () => {
    const customNetwork = {
      chainId: '0x1',
      id: '2f9ae569-1d3e-492b-8741-cb10c2434f91',
      nickname: 'Flashbots Protect',
      rpcPrefs: { imageUrl: './images/eth_logo.svg' },
      rpcUrl: 'https://rpc.flashbots.net',
      ticker: 'ETH',
      removable: true,
    };
    const providerConfig = {
      chainId: '0x1',
      id: '2f9ae569-1d3e-492b-8741-cb10c2434f91',
      nickname: 'Flashbots Protect',
      rpcPrefs: {},
      rpcUrl: 'https://rpc.flashbots.net',
      ticker: 'ETH',
      type: 'rpc',
    };
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          providerConfig,
          networkConfigurations: {
            ...mockState.metamask.networkConfigurations,
            [customNetwork.id]: customNetwork,
          },
        },
        confirm: {
          currentConfirmation: { id: '1', chainId: '0x1' },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Flashbots Protect');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.svg');
  });
});
