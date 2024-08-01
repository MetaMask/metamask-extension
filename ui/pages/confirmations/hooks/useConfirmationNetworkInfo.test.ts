import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useConfirmationNetworkInfo from './useConfirmationNetworkInfo';

describe('useConfirmationNetworkInfo', () => {
  it('returns display name and image when confirmation chainId is present', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'mainnet',
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

          selectedNetworkClientId: 'networkClientId',
          networkConfigurations: {
            networkClientId: {
              id: 'networkClientId',
              chainId: '0x7',
              rpcUrl: 'https://testrpc.com',
              nickname: 'Custom Mainnet RPC',
            },
          },
        },
        confirm: {
          currentConfirmation: { id: '1', msgParams: {} },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Custom Mainnet RPC');
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
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: customNetwork.id,
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
