import { toChecksumAddress } from 'ethereumjs-util';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import * as bridgeSelectors from '../../ducks/bridge/selectors';
import useBridging from './useBridging';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockDispatch = jest.fn().mockReturnValue(() => jest.fn());
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockSetFromChain = jest.fn();
jest.mock('../../ducks/bridge/actions', () => ({
  ...jest.requireActual('../../ducks/bridge/actions'),
  setFromChain: () => mockSetFromChain(),
}));

const MOCK_METAMETRICS_ID = '0xtestMetaMetricsId';

const renderUseBridging = (mockStoreState: object, pathname?: string) =>
  renderHookWithProvider(() => useBridging(), mockStoreState, pathname);

describe('useBridging', () => {
  beforeAll(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
  });

  describe('extensionConfig.support=true, chain=1', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        getNativeAssetForChainId(CHAIN_IDS.MAINNET),
        'Home',
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        getNativeAssetForChainId(CHAIN_IDS.MAINNET),
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/slip44:60',
        getNativeAssetForChainId(CHAIN_IDS.OPTIMISM),
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        {
          ...getNativeAssetForChainId(CHAIN_IDS.MAINNET),
          chainId: 1,
        },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        {
          ...getNativeAssetForChainId(CHAIN_IDS.MAINNET),
          chainId: 243,
        },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        {
          iconUrl: 'https://icon.url',
          symbol: 'TEST',
          address: toChecksumAddress(
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
          ),
          balance: '0x5f5e100',
          string: '123',
          chainId: '0xa',
          decimals: 18,
        },
        MetaMetricsSwapsEventSource.TokenView,
        true,
      ],
    ])(
      'should open %s with the currently selected token: %p',
      async (
        expectedUrl: string,
        token: string,
        location: string,
        isSwap: boolean,
      ) => {
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        jest
          .spyOn(bridgeSelectors, 'getFromChains')
          .mockReturnValueOnce([
            { chainId: CHAIN_IDS.MAINNET } as unknown as NetworkConfiguration,
            { chainId: CHAIN_IDS.OPTIMISM } as unknown as NetworkConfiguration,
          ]);
        const { result } = renderUseBridging({
          metamask: {
            useExternalServices: true,
            ...mockNetworkState(
              {
                chainId: CHAIN_IDS.MAINNET,
              },
              { chainId: CHAIN_IDS.OPTIMISM },
            ),
            metaMetricsId: MOCK_METAMETRICS_ID,
            remoteFeatureFlags: {
              bridgeConfig: {
                refreshRate: 5000,
                minimumVersion: '0.0.0',
                maxRefreshCount: 5,
                chains: {
                  '1': {
                    isActiveSrc: true,
                    isActiveDest: false,
                  },
                },
              },
            },
            enabledNetworkMap: {
              eip155: {
                '1': true,
              },
            },
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        result.current.openBridgeExperience(location, token, isSwap);

        expect(mockDispatch.mock.calls).toHaveLength(2);
        expect(mockUseNavigate).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/',
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        undefined,
        'Home',
        true,
      ],
      [
        '/asset/0xa/',
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/slip44:60',
        getNativeAssetForChainId(CHAIN_IDS.OPTIMISM),
        MetaMetricsSwapsEventSource.TokenView,
        true,
      ],
      [
        '/asset/0xa/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        {
          iconUrl: 'https://icon.url',
          symbol: 'TEST',
          address: toChecksumAddress(
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
          ),
          balance: '0x5f5e100',
          string: '123',
          chainId: '0xa',
          decimals: 18,
        },
        MetaMetricsSwapsEventSource.TokenView,
        true,
      ],
    ])(
      'should open swap with correct token pair when pathname is %s',
      async (
        pathname: string,
        expectedUrl: string,
        token: string,
        location: string,
        isSwap: boolean,
      ) => {
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        jest
          .spyOn(bridgeSelectors, 'getFromChains')
          .mockReturnValueOnce([
            { chainId: CHAIN_IDS.MAINNET } as unknown as NetworkConfiguration,
            { chainId: CHAIN_IDS.OPTIMISM } as unknown as NetworkConfiguration,
          ]);
        const { result } = renderUseBridging({
          metamask: {
            useExternalServices: true,
            ...mockNetworkState({ chainId: CHAIN_IDS.BSC }),
            metaMetricsId: MOCK_METAMETRICS_ID,
            remoteFeatureFlags: {
              bridgeConfig: {
                bip44DefaultPairs: {
                  eip155: {
                    standard: {
                      'eip155:1/slip44:60':
                        'eip155:1/erc20:0x0b2c639c533813f4aa9d7837caf62653d097ff84',
                    },
                  },
                },
                refreshRate: 5000,
                minimumVersion: '0.0.0',
                maxRefreshCount: 5,
                chains: {
                  '1': {
                    isActiveSrc: true,
                    isActiveDest: true,
                  },
                  '10': {
                    isActiveSrc: true,
                    isActiveDest: true,
                  },
                },
              },
            },
            enabledNetworkMap: {
              eip155: {
                '10': true,
              },
            },
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
            pathname,
          },
        });

        result.current.openBridgeExperience(location, token, isSwap);

        expect(mockDispatch.mock.calls).toHaveLength(2);
        expect(mockUseNavigate).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
