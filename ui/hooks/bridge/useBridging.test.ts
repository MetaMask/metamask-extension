import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../shared/constants/swaps';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import useBridging from './useBridging';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

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

const renderUseBridging = (mockStoreState: object) =>
  renderHookWithProvider(() => useBridging(), mockStoreState);

describe('useBridging', () => {
  beforeAll(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
  });

  describe('extensionConfig.support=false, chainId=1', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        'https://portfolio.test/bridge?metamaskEntry=ext_bridge_button&metametricsId=0xtestMetaMetricsId&metricsEnabled=false&marketingEnabled=null&token=0x0000000000000000000000000000000000000000',
        ETH_SWAPS_TOKEN_OBJECT,
        'Home',
        undefined,
      ],
      [
        'https://portfolio.test/bridge?metamaskEntry=ext_bridge_button&metametricsId=0xtestMetaMetricsId&metricsEnabled=false&marketingEnabled=null&token=native',
        ETH_SWAPS_TOKEN_OBJECT,
        MetaMetricsSwapsEventSource.TokenView,
        '&token=native',
      ],
      [
        'https://portfolio.test/bridge?metamaskEntry=ext_bridge_button&metametricsId=0xtestMetaMetricsId&metricsEnabled=false&marketingEnabled=null&token=0x00232f2jksdauo',
        {
          iconUrl: 'https://icon.url',
          symbol: 'TEST',
          address: '0x00232f2jksdauo',
          balance: '0x5f5e100',
          string: '123',
        },
        MetaMetricsSwapsEventSource.TokenView,
        undefined,
      ],
    ])(
      'should open %s with the currently selected token: %p',
      (
        expectedUrl: string,
        token: string,
        location: string,
        urlSuffix: string,
      ) => {
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        const { result } = renderUseBridging({
          metamask: {
            useExternalServices: true,
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            metaMetricsId: MOCK_METAMETRICS_ID,
            remoteFeatureFlags: {
              bridgeConfig: {
                support: false,
                minimumVersion: '0.0.0',
                refreshRate: 5000,
                maxRefreshCount: 5,
                chains: {
                  '1': {
                    isActiveSrc: true,
                    isActiveDest: false,
                  },
                },
              },
            },
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        expect(mockDispatch.mock.calls).toHaveLength(0);

        result.current.openBridgeExperience(location, token, urlSuffix);

        expect(openTabSpy).toHaveBeenCalledWith({
          url: expectedUrl,
        });
      },
    );
  });

  describe('extensionConfig.support=true, chain=1', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/cross-chain/swaps/prepare-swap-page?token=0x0000000000000000000000000000000000000000',
        ETH_SWAPS_TOKEN_OBJECT,
        'Home',
        undefined,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?token=0x0000000000000000000000000000000000000000',
        ETH_SWAPS_TOKEN_OBJECT,
        MetaMetricsSwapsEventSource.TokenView,
        '&token=native',
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?token=0x00232f2jksdauo',
        {
          iconUrl: 'https://icon.url',
          symbol: 'TEST',
          address: '0x00232f2jksdauo',
          balance: '0x5f5e100',
          string: '123',
        },
        MetaMetricsSwapsEventSource.TokenView,
        undefined,
      ],
    ])(
      'should open %s with the currently selected token: %p',
      async (
        expectedUrl: string,
        token: string,
        location: string,
        urlSuffix: string,
      ) => {
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        const { result } = renderUseBridging({
          metamask: {
            useExternalServices: true,
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            metaMetricsId: MOCK_METAMETRICS_ID,
            remoteFeatureFlags: {
              bridgeConfig: {
                support: true,
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
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        result.current.openBridgeExperience(location, token, urlSuffix);

        expect(mockDispatch.mock.calls).toHaveLength(1);
        expect(mockHistoryPush.mock.calls).toHaveLength(1);
        expect(mockHistoryPush).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
