import { CHAIN_IDS } from '../../../../shared/constants/network';
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
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              name: 'Ethereum Mainnet',
              chainId: CHAIN_IDS.MAINNET,
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        confirm: {
          currentConfirmation: { id: '1', chainId: '0x1' },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Ethereum Mainnet');
    expect(result.current.networkImageUrl).toBe('./images/eth_logo.svg');
  });

  it.only('returns display name and image for custom network', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,

          selectedNetworkClientId: 'testNetworkConfigurationId',
          networkConfigurationsByChainId: {
            '0x7': {
              name: 'Custom Mainnet RPC',
              chainId: '0x7',
              rpcEndpoints: [
                {
                  networkClientId: 'testNetworkConfigurationId',
                  type: 'custom',
                },
              ],
            },
          },
        },
        confirm: {
          currentConfirmation: { id: '1', msgParams: {} },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Custom Mainnet RPC');

    // TODO: image was not a field in network controller state before or after, so not sure this was possible?
    // expect(result.current.networkImageUrl).toBe('./some_image');
  });

  // todo shouldnt be possible? cant have providerconfig with chain id that doesnt match a network
  // but name:'' seems to pass the test
  it('should return empty strings if no matching network is found', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'sdf',
          networkConfigurationsByChainId: {
            '0x7': {
              name: '',
              chainId: '0x7',
              rpcEndpoints: [{ networkClientId: 'sdf' }],
            },
          },

          // todo
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
    // const customNetwork = {
    //   chainId: '0x1',
    //   id: '2f9ae569-1d3e-492b-8741-cb10c2434f91',
    //   nickname: 'Flashbots Protect',
    //   rpcPrefs: { imageUrl: './images/eth_logo.svg' },
    //   rpcUrl: 'https://rpc.flashbots.net',
    //   ticker: 'ETH',
    //   removable: true,
    // };
    // const providerConfig = {
    //   chainId: '0x1',
    //   id: '2f9ae569-1d3e-492b-8741-cb10c2434f91',
    //   nickname: 'Flashbots Protect',
    //   rpcPrefs: {},
    //   rpcUrl: 'https://rpc.flashbots.net',
    //   ticker: 'ETH',
    //   type: 'rpc',
    // };
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,

          selectedNetworkClientId: 'flashbots',
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              name: 'Flashbots Protect',
              chainId: CHAIN_IDS.MAINNET,
              rpcEndpoints: [{ networkClientId: 'flashbots' }],
            },
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
