import nock from 'nock';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../shared/constants/swaps';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn().mockReturnValue(() => jest.fn()),
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

  describe('extensionSupport=false, chainId=1', () => {
    beforeEach(() => {
      nock(BRIDGE_API_BASE_URL)
        .get('/getAllFeatureFlags')
        .reply(200, { 'extension-support': false });
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
            bridgeState: {
              bridgeFeatureFlags: {
                extensionSupport: false,
              },
            },
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        expect(nock(BRIDGE_API_BASE_URL).isDone()).toBe(true);
        result.current.openBridgeExperience(location, token, urlSuffix);

        expect(openTabSpy).toHaveBeenCalledWith({
          url: expectedUrl,
        });
      },
    );
  });

  describe('extensionSupport=true, chain=1', () => {
    beforeEach(() => {
      nock(BRIDGE_API_BASE_URL)
        .get('/getAllFeatureFlags')
        .reply(200, { 'extension-support': true });
      jest.clearAllMocks();
    });
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/cross-chain/swaps/prepare-swap-page',
        ETH_SWAPS_TOKEN_OBJECT,
        'Home',
        undefined,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page',
        ETH_SWAPS_TOKEN_OBJECT,
        MetaMetricsSwapsEventSource.TokenView,
        '&token=native',
      ],
      [
        '/cross-chain/swaps/prepare-swap-page',
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
            bridgeState: {
              bridgeFeatureFlags: {
                extensionSupport: true,
              },
            },
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        result.current.openBridgeExperience(location, token, urlSuffix);

        expect(mockHistoryPush.mock.calls).toHaveLength(1);
        expect(mockHistoryPush).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
