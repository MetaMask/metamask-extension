import { toChecksumAddress } from 'ethereumjs-util';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../shared/constants/swaps';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../test/stub/networks';
import { CHAIN_IDS } from '../../../shared/constants/network';
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

  describe('extensionConfig.support=true, chain=1', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        ETH_SWAPS_TOKEN_OBJECT,
        'Home',
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:1/slip44:60',
        ETH_SWAPS_TOKEN_OBJECT,
        MetaMetricsSwapsEventSource.TokenView,
        false,
      ],
      [
        '/cross-chain/swaps/prepare-swap-page?from=eip155:10/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&swaps=true',
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
        const { result } = renderUseBridging({
          metamask: {
            useExternalServices: true,
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
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
            internalAccounts: {
              selectedAccount: '0xabc',
              accounts: { '0xabc': { metadata: { keyring: {} } } },
            },
          },
        });

        result.current.openBridgeExperience(location, token, isSwap);

        expect(mockDispatch.mock.calls).toHaveLength(2);
        expect(mockUseNavigate).toHaveBeenCalledTimes(1);
        expect(mockUseNavigate).toHaveBeenCalledWith(expectedUrl);
        expect(openTabSpy).not.toHaveBeenCalled();
      },
    );
  });
});
