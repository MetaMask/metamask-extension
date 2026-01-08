import { toChecksumAddress } from 'ethereumjs-util';
import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import * as bridgeSelectors from '../../ducks/bridge/selectors';
import useBridging from './useBridging';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockDispatch = jest.fn().mockReturnValue(() => jest.fn());
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
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
        '/cross-chain/swaps/prepare-swap-page',
        { ...getNativeAssetForChainId(CHAIN_IDS.OPTIMISM), chainId: 123 },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page',
        {
          ...getNativeAssetForChainId(CHAIN_IDS.SEI),
          chainId: 243,
        },
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
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
        token: Record<string, unknown>,
        location: string,
        isSwap: boolean,
      ) => {
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
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
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
      // Should use bip44 default asset for BTC
      [
        `/`,
        '/cross-chain/swaps/prepare-swap-page?from=bip122:000000000019d6689c085ae165831e93/slip44:0',
        getNativeAssetForChainId(MultichainNetworks.BITCOIN),
        MetaMetricsSwapsEventSource.TokenView,
        true,
      ],
      // Should use bip44 default asset for SOLANA
      [
        '/',
        '/cross-chain/swaps/prepare-swap-page?from=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        getNativeAssetForChainId(MultichainNetworks.SOLANA),
        MetaMetricsSwapsEventSource.TokenView,
        true,
      ],
      // test account has no TRON account
      [
        '/',
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        getNativeAssetForChainId(MultichainNetworks.TRON),
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

        result.current.openBridgeExperience(location, token, isSwap);

        expect(mockDispatch.mock.calls).toHaveLength(2);
        expect(mockUseNavigate).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
