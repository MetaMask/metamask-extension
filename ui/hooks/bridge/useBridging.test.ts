import { toChecksumAddress } from 'ethereumjs-util';
import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import * as bridgeSelectors from '../../ducks/bridge/selectors';
import * as bridgeActions from '../../ducks/bridge/actions';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import useBridging from './useBridging';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockDispatch = jest.fn((...args: unknown[]) => jest.fn()(...args));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch:
    () =>
    (...args: unknown[]) =>
      mockDispatch(...args),
}));

const MOCK_METAMETRICS_ID = '0xtestMetaMetricsId';
const BRIDGE_PREPARE_PATH = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;

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
        BRIDGE_PREPARE_PATH,
        getNativeAssetForChainId(CHAIN_IDS.MAINNET),
        'Home',
        false,
        { token: getNativeAssetForChainId(CHAIN_IDS.MAINNET) },
      ],
      [
        BRIDGE_PREPARE_PATH,
        getNativeAssetForChainId(CHAIN_IDS.MAINNET),
        MetaMetricsSwapsEventSource.TokenView,
        false,
        { token: getNativeAssetForChainId(CHAIN_IDS.MAINNET) },
      ],
      [
        BRIDGE_PREPARE_PATH,
        getNativeAssetForChainId(CHAIN_IDS.OPTIMISM),
        MetaMetricsSwapsEventSource.TokenView,
        false,
        { token: getNativeAssetForChainId(CHAIN_IDS.OPTIMISM) },
      ],
      [
        BRIDGE_PREPARE_PATH,
        { ...getNativeAssetForChainId(CHAIN_IDS.OPTIMISM), chainId: 123 },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        BRIDGE_PREPARE_PATH,
        {
          ...getNativeAssetForChainId(CHAIN_IDS.SEI),
          chainId: 243,
        },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        BRIDGE_PREPARE_PATH,
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
        {
          token: {
            iconUrl: 'https://icon.url',
            string: '123',
            symbol: 'TEST',
            address: toChecksumAddress(
              '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
            ),
            balance: '0x5f5e100',
            chainId: '0xa',
            decimals: 18,
            name: 'TEST',
            assetId:
              'eip155:10/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          },
        },
      ],
    ])(
      'should open %s with the currently selected token: %p',
      async (
        expectedUrl: string,
        token: Record<string, unknown>,
        location: string,
        isSwap: boolean,
        expectedState: { token: { chainId: string } | null } = { token: null },
      ) => {
        const trackUnifiedSwapBridgeEventSpy = jest
          .spyOn(bridgeActions, 'trackUnifiedSwapBridgeEvent')
          .mockImplementation((...args: unknown[]) => jest.fn()(...args));
        const resetBridgeControllerAndCacheSpy = jest
          .spyOn(bridgeActions, 'resetBridgeControllerAndCache')
          .mockImplementation((...args: unknown[]) => jest.fn()(...args));
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        const { result } = renderUseBridging(
          createBridgeMockStore({
            metamaskStateOverrides: {
              useExternalServices: true,
              metaMetricsId: MOCK_METAMETRICS_ID,
              enabledNetworkMap: {
                eip155: {
                  '1': true,
                  '10': true,
                  '56': true,
                },
                bip122: {
                  'bip122:000000000019d6689c085ae165831e93': true,
                },
                solana: {
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
                },
                tron: {
                  'tron:728126428': true,
                },
              },
            },
            featureFlagOverrides: {
              bridgeConfig: {
                refreshRate: 5000,
                minimumVersion: '0.0.0',
                maxRefreshCount: 5,
                chainRanking: [
                  { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
                  { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
                  { chainId: MultichainNetworks.SOLANA },
                  { chainId: MultichainNetworks.TRON },
                  { chainId: MultichainNetworks.BITCOIN },
                  { chainId: formatChainIdToCaip(CHAIN_IDS.BSC) },
                ],
              },
            },
          }),
        );

        result.current.openBridgeExperience(location, token, isSwap);

        expect(mockDispatch.mock.calls.length).toStrictEqual(4);
        expect(mockDispatch.mock.calls[0]).toStrictEqual([
          {
            payload: undefined,
            type: 'bridge/resetInputFields',
          },
        ]);
        expect(trackUnifiedSwapBridgeEventSpy.mock.calls).toStrictEqual([
          [
            UnifiedSwapBridgeEventName.ButtonClicked,
            {
              location: location as never,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol_source: token?.symbol ?? 'ETH',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol_destination: '',
            },
          ],
          [UnifiedSwapBridgeEventName.PageViewed, {}],
        ]);
        expect(resetBridgeControllerAndCacheSpy).toHaveBeenCalledTimes(1);

        expect(mockUseNavigate).toHaveBeenCalledWith(
          { pathname: expectedUrl, search: '' },
          {
            replace: false,
            state: {
              ...expectedState,
              token: expectedState.token
                ? {
                    ...expectedState.token,
                    chainId: formatChainIdToCaip(expectedState.token.chainId),
                  }
                : null,
            },
          },
        );
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: `from=${encodeURIComponent('eip155:1/slip44:60')}`,
        },
        undefined,
        'Home',
      ],
      [
        '/asset/0xa/',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        getNativeAssetForChainId(CHAIN_IDS.OPTIMISM),
        MetaMetricsSwapsEventSource.TokenView,
        {
          token: getNativeAssetForChainId(CHAIN_IDS.OPTIMISM),
        },
      ],
      [
        '/asset/0xa/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        {
          iconUrl: 'https://icon.url',
          symbol: 'TEST',
          address: toChecksumAddress(
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
          ),
          balance: '0x5f5e100',
          name: 'Test token',
          string: '123',
          chainId: '0xa',
          decimals: 18,
        },
        MetaMetricsSwapsEventSource.TokenView,
        {
          token: {
            symbol: 'TEST',
            address: toChecksumAddress(
              '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
            ),
            balance: '0x5f5e100',
            iconUrl: 'https://icon.url',
            string: '123',
            chainId: '0xa',
            decimals: 18,
            name: 'Test token',
            assetId:
              'eip155:10/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          },
        },
      ],
      [
        '/asset/0xa/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: `from=${encodeURIComponent('eip155:10/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')}`,
        },
        {
          iconUrl: 'https://icon.url',
          address: toChecksumAddress(
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
          ),
          balance: '0x5f5e100',
          name: 'Test token',
          string: '123',
          chainId: '0xa',
          decimals: 18,
        },
        MetaMetricsSwapsEventSource.TokenView,
      ],
      // Should use bip44 default asset for BTC
      [
        `/`,
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        getNativeAssetForChainId(MultichainNetworks.BITCOIN),
        MetaMetricsSwapsEventSource.TokenView,
        {
          token: getNativeAssetForChainId(MultichainNetworks.BITCOIN),
        },
      ],
      // Should use bip44 default asset for SOLANA
      [
        '/',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        getNativeAssetForChainId(MultichainNetworks.SOLANA),
        MetaMetricsSwapsEventSource.TokenView,
        {
          token: getNativeAssetForChainId(MultichainNetworks.SOLANA),
        },
      ],
      // test account has no TRON account
      [
        '/',
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        getNativeAssetForChainId(MultichainNetworks.TRON),
        MetaMetricsSwapsEventSource.TokenView,
        {
          token: {
            address: '0x0000000000000000000000000000000000000000',
            assetId: 'tron:728126428/slip44:195',
            chainId: 'tron:728126428',
            decimals: 6,
            iconUrl: '',
            name: 'Tron',
            symbol: 'TRX',
          },
        },
      ],
    ])(
      'should open swap with correct token pair when pathname is %s',
      async (
        pathname: string,
        expectedUrl: string,
        token: { symbol: string },
        location: string,
        expectedState: { token: { chainId: string } | null } = { token: null },
      ) => {
        const trackUnifiedSwapBridgeEventSpy = jest
          .spyOn(bridgeActions, 'trackUnifiedSwapBridgeEvent')
          .mockImplementation((...args: unknown[]) => jest.fn()(...args));
        const resetBridgeControllerAndCacheSpy = jest
          .spyOn(bridgeActions, 'resetBridgeControllerAndCache')
          .mockImplementation((...args: unknown[]) => jest.fn()(...args));
        const openTabSpy = jest.spyOn(global.platform, 'openTab');
        jest
          .spyOn(bridgeSelectors, 'getLastSelectedChainId')
          .mockReturnValueOnce(formatChainIdToCaip(CHAIN_IDS.MAINNET));

        const { result } = renderUseBridging(
          createBridgeMockStore({
            metamaskStateOverrides: {
              useExternalServices: true,
              ...mockNetworkState(
                { chainId: CHAIN_IDS.BSC },
                { chainId: CHAIN_IDS.OPTIMISM },
              ),
              metaMetricsId: MOCK_METAMETRICS_ID,
              enabledNetworkMap: {
                eip155: {
                  '10': true,
                  '56': true,
                },
                bip122: {
                  'bip122:000000000019d6689c085ae165831e93': true,
                },
                solana: {
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
                },
                tron: {
                  [MultichainNetworks.TRON]: true,
                },
              },
              pathname,
            },
            featureFlagOverrides: {
              bridgeConfig: {
                refreshRate: 5000,
                minimumVersion: '0.0.0',
                maxRefreshCount: 5,
                chainRanking: [
                  { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
                  { chainId: MultichainNetworks.SOLANA },
                  { chainId: MultichainNetworks.TRON },
                  { chainId: MultichainNetworks.BITCOIN },
                  { chainId: formatChainIdToCaip(CHAIN_IDS.BSC) },
                ],
              },
            },
          }),
        );

        result.current.openBridgeExperience(location, token, true);

        expect(mockDispatch.mock.calls.length).toStrictEqual(4);
        expect(mockDispatch.mock.calls[0]).toStrictEqual([
          {
            payload: undefined,
            type: 'bridge/resetInputFields',
          },
        ]);
        expect(trackUnifiedSwapBridgeEventSpy.mock.calls).toStrictEqual([
          [
            UnifiedSwapBridgeEventName.ButtonClicked,
            {
              location: location as never,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol_destination: '',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol_source: token?.symbol ?? 'ETH',
            },
          ],
          [UnifiedSwapBridgeEventName.PageViewed, {}],
        ]);
        expect(resetBridgeControllerAndCacheSpy).toHaveBeenCalledTimes(1);

        expect(mockUseNavigate).toHaveBeenCalledWith(expectedUrl, {
          replace: false,
          state: {
            ...expectedState,
            token: expectedState.token
              ? {
                  ...expectedState.token,
                  chainId: formatChainIdToCaip(expectedState.token.chainId),
                }
              : null,
          },
        });
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
