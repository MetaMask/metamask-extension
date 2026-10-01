import type {
  Country,
  Provider,
  RampsOrder,
  RampsToken,
  ResourceState,
  TokensResponse,
  UserRegion,
} from '@metamask/ramps-controller';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  RAMPS_BUILD_QUOTE_ROUTE,
  RAMPS_TOKEN_SELECTION_ROUTE,
} from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  hasAttemptedPortfolioBuyMigration,
  markPortfolioBuyMigrationAttempted,
  PORTFOLIO_ORIGINS,
} from '../utils/portfolioConnection';
import useRampsNavigation, {
  type RampIntent,
  type RampsNavigationResult,
} from './useRampsNavigation';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../utils/portfolioConnection', () => ({
  ...jest.requireActual('../utils/portfolioConnection'),
  hasAttemptedPortfolioBuyMigration: jest.fn().mockResolvedValue(false),
  markPortfolioBuyMigrationAttempted: jest.fn().mockResolvedValue(undefined),
}));

const mockHasAttemptedPortfolioBuyMigration =
  hasAttemptedPortfolioBuyMigration as jest.Mock;
const mockMarkPortfolioBuyMigrationAttempted =
  markPortfolioBuyMigrationAttempted as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockBackground = submitRequestToBackground as jest.Mock;
// `submitRequestToBackground` backs both the geolocation lookup and
// `setRampsSelectedToken`; the geolocation result is what the gate reads.
const mockGetGeolocation = mockBackground;
// Per-method responses; unlisted methods (e.g. `getRampsTokens`) resolve to
// undefined, like a controller with nothing to return.
const backgroundHandlers: Record<string, () => unknown> = {};
const openTab = jest.fn();

const region: UserRegion = {
  country: { isoCode: 'US', supported: { buy: true } } as Country,
  state: null,
  regionCode: 'us',
};
const loaded: ResourceState<Country[]> = {
  data: [],
  selected: null,
  isLoading: false,
  error: null,
};

const connectedPortfolioHistory = {
  [PORTFOLIO_ORIGINS[0]]: {
    // Permission controller history key (snake_case RPC method).
    // eslint-disable-next-line @typescript-eslint/naming-convention
    eth_accounts: {
      accounts: { '0xabc': 1 },
      lastApproved: 1,
    },
  },
};

type MetamaskOverrides = Partial<{
  remoteFeatureFlags: {
    rampsEnabled: boolean;
    rampsServiceDisruption: boolean;
  };
  userRegion: UserRegion | null;
  countries: ResourceState<Country[]>;
  providers: ResourceState<Provider[], Provider | null>;
  tokens: ResourceState<TokensResponse | null, RampsToken | null>;
  subjects: Record<string, unknown>;
  permissionHistory: Record<string, unknown>;
  isBackupAndSyncEnabled: boolean;
  isRampsSyncingEnabled: boolean;
  orders: RampsOrder[];
}>;

const buildState = (over: MetamaskOverrides = {}) => ({
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    remoteFeatureFlags: { rampsEnabled: true, rampsServiceDisruption: false },
    userRegion: region,
    countries: { ...loaded, data: [region.country] },
    providers: {
      data: [{ id: 'p' } as Provider],
      selected: null,
      isLoading: false,
      error: null,
    },
    tokens: {
      data: { topTokens: [{} as RampsToken], allTokens: [{} as RampsToken] },
      selected: null,
      isLoading: false,
      error: null,
    },
    subjects: {},
    permissionHistory: {},
    isBackupAndSyncEnabled: true,
    isRampsSyncingEnabled: true,
    orders: [],
    ...over,
  },
});

const run = (state: ReturnType<typeof buildState>) => {
  const { result, store } = renderHookWithProvider(
    () => useRampsNavigation(),
    state,
  );
  // Assert on the resulting modal state rather than spying on
  // `store.dispatch` — `useDispatch()` captures the store's dispatch
  // reference at render time, before a post-render `jest.spyOn` swap would
  // apply, so a dispatch spy set up after render never observes the call.
  const getModalName = () => store.getState().appState.modal.modalState.name;
  return { result, getModalName };
};

const goToBuy = async (
  result: { current: ReturnType<typeof useRampsNavigation> },
  intent: RampIntent = { chainId: '0x1' },
): Promise<RampsNavigationResult | undefined> => {
  let opened: RampsNavigationResult | undefined;
  await act(async () => {
    opened = await result.current.goToBuy(intent);
  });
  return opened;
};

beforeAll(() => {
  Object.defineProperty(global, 'platform', {
    value: { openTab },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockHasAttemptedPortfolioBuyMigration.mockResolvedValue(false);
  // Default: geolocation resolves to a known location so the geo-unknown gate
  // passes and later gates are exercised.
  Object.keys(backgroundHandlers).forEach((m) => delete backgroundHandlers[m]);
  backgroundHandlers.getGeolocation = () => 'US-CA';
  mockBackground.mockImplementation(async (method: string) =>
    backgroundHandlers[method]?.(),
  );
});

describe('useRampsNavigation goToBuy', () => {
  it('flag off → opens Portfolio (no modal, no geolocation lookup)', async () => {
    const { result, getModalName } = run(
      buildState({
        remoteFeatureFlags: {
          rampsEnabled: false,
          rampsServiceDisruption: false,
        },
      }),
    );
    const destination = await goToBuy(result);
    expect(destination).toBe('portfolio');
    expect(openTab).toHaveBeenCalled();
    expect(mockGetGeolocation).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });

  it('flag on + connected to Portfolio + no orders → opens Portfolio once', async () => {
    const { result, getModalName } = run(
      buildState({
        subjects: {
          [PORTFOLIO_ORIGINS[0]]: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [
                            'eip155:1:0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                          ],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
                parentCapability: 'endowment:caip25',
              },
            },
          },
        },
      }),
    );
    const opened = await goToBuy(result);
    expect(opened).toBe('portfolio');
    expect(mockHasAttemptedPortfolioBuyMigration).toHaveBeenCalledTimes(1);
    expect(mockMarkPortfolioBuyMigrationAttempted).toHaveBeenCalledTimes(1);
    expect(openTab.mock.invocationCallOrder[0]).toBeLessThan(
      mockMarkPortfolioBuyMigrationAttempted.mock.invocationCallOrder[0],
    );
    expect(openTab).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });

  it('uses the supplied deep-link URL for the Portfolio migration', async () => {
    const { result } = run(
      buildState({
        subjects: {
          [PORTFOLIO_ORIGINS[0]]: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [
                            'eip155:1:0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                          ],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
                parentCapability: 'endowment:caip25',
              },
            },
          },
        },
      }),
    );

    await act(async () => {
      await result.current.goToBuy(undefined, {
        portfolioRedirectUrl: 'https://app.metamask.io/buy?address=0xabc',
      });
    });

    expect(openTab).toHaveBeenCalledWith({
      url: 'https://app.metamask.io/buy?address=0xabc',
    });
  });

  it('runs the Portfolio migration before native eligibility checks', async () => {
    const { result, getModalName } = run(
      buildState({
        permissionHistory: connectedPortfolioHistory,
        userRegion: null,
      }),
    );

    expect(await goToBuy(result)).toBe('portfolio');
    expect({
      geolocationCalls: mockGetGeolocation.mock.calls,
      markerWrites: mockMarkPortfolioBuyMigrationAttempted.mock.calls,
      openTabCalls: openTab.mock.calls.length,
      modalName: getModalName(),
    }).toMatchInlineSnapshot(`
      {
        "geolocationCalls": [],
        "markerWrites": [
          [],
        ],
        "modalName": null,
        "openTabCalls": 1,
      }
    `);
  });

  it('does not consume the migration when Portfolio fails to open', async () => {
    openTab.mockRejectedValueOnce(new Error('failed to open'));
    const { result } = run(
      buildState({ permissionHistory: connectedPortfolioHistory }),
    );

    await expect(goToBuy(result)).rejects.toThrow('failed to open');
    expect(
      mockMarkPortfolioBuyMigrationAttempted.mock.calls,
    ).toMatchInlineSnapshot(`[]`);
  });

  it('shares an in-flight Portfolio migration between concurrent Buy clicks', async () => {
    const { result } = run(
      buildState({ permissionHistory: connectedPortfolioHistory }),
    );
    let destinations: RampsNavigationResult[] = [];

    await act(async () => {
      destinations = await Promise.all([
        result.current.goToBuy({ chainId: '0x1' }),
        result.current.goToBuy({ chainId: '0x1' }),
      ]);
    });

    expect({
      destinations,
      markerReadCount: mockHasAttemptedPortfolioBuyMigration.mock.calls.length,
      markerWriteCount:
        mockMarkPortfolioBuyMigrationAttempted.mock.calls.length,
      openTabCount: openTab.mock.calls.length,
    }).toMatchInlineSnapshot(`
      {
        "destinations": [
          "portfolio",
          "portfolio",
        ],
        "markerReadCount": 1,
        "markerWriteCount": 1,
        "openTabCount": 1,
      }
    `);
  });

  it('flag on + connected to Portfolio + migration attempted → opens native buy', async () => {
    mockHasAttemptedPortfolioBuyMigration.mockResolvedValue(true);
    const { result } = run(
      buildState({
        permissionHistory: connectedPortfolioHistory,
      }),
    );
    const opened = await goToBuy(result);
    expect({
      opened,
      markerReadCount: mockHasAttemptedPortfolioBuyMigration.mock.calls.length,
      markerWriteCount:
        mockMarkPortfolioBuyMigrationAttempted.mock.calls.length,
      openTabCount: openTab.mock.calls.length,
      navigationCalls: mockNavigate.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "markerReadCount": 1,
        "markerWriteCount": 0,
        "navigationCalls": [
          [
            "/ramps/token-selection",
            {
              "replace": false,
            },
          ],
        ],
        "openTabCount": 0,
        "opened": "native",
      }
    `);
  });

  it('flag on + connected to Portfolio + synced orders → opens native buy', async () => {
    const { result } = run(
      buildState({
        permissionHistory: connectedPortfolioHistory,
        orders: [{ id: 'synced-order' } as RampsOrder],
      }),
    );
    const opened = await goToBuy(result);
    expect({
      opened,
      markerReadCount: mockHasAttemptedPortfolioBuyMigration.mock.calls.length,
      markerWriteCount:
        mockMarkPortfolioBuyMigrationAttempted.mock.calls.length,
      openTabCount: openTab.mock.calls.length,
      navigationCalls: mockNavigate.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "markerReadCount": 0,
        "markerWriteCount": 0,
        "navigationCalls": [
          [
            "/ramps/token-selection",
            {
              "replace": false,
            },
          ],
        ],
        "openTabCount": 0,
        "opened": "native",
      }
    `);
  });

  it('flag on + never connected to Portfolio → in-app token selection', async () => {
    const { result, getModalName } = run(buildState());
    const opened = await goToBuy(result);
    expect(opened).toBe('native');
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: false,
    });
    expect(openTab).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });

  it('opens native buy when order syncing is disabled', async () => {
    for (const syncState of [
      { isRampsSyncingEnabled: false },
      { isBackupAndSyncEnabled: false },
    ]) {
      const { result } = run(
        buildState({
          permissionHistory: connectedPortfolioHistory,
          ...syncState,
        }),
      );
      await goToBuy(result);
    }
    expect(mockHasAttemptedPortfolioBuyMigration).not.toHaveBeenCalled();
    expect(mockMarkPortfolioBuyMigrationAttempted).not.toHaveBeenCalled();
  });

  it('service disruption → shows RAMPS_SERVICE_DISRUPTION (before geolocation)', async () => {
    const { result, getModalName } = run(
      buildState({
        remoteFeatureFlags: {
          rampsEnabled: true,
          rampsServiceDisruption: true,
        },
      }),
    );
    const opened = await goToBuy(result);
    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_SERVICE_DISRUPTION');
    expect(mockGetGeolocation).not.toHaveBeenCalled();
  });

  it('geolocation UNKNOWN → shows RAMPS_ELIGIBILITY_FAILED', async () => {
    mockGetGeolocation.mockResolvedValue(UNKNOWN_LOCATION);
    const { result, getModalName } = run(buildState());
    await goToBuy(result);
    expect(getModalName()).toBe('RAMPS_ELIGIBILITY_FAILED');
    expect(openTab).not.toHaveBeenCalled();
  });

  it('geolocation lookup fails → shows RAMPS_ELIGIBILITY_FAILED', async () => {
    mockGetGeolocation.mockRejectedValue(new Error('network down'));
    const { result, getModalName } = run(buildState());
    await goToBuy(result);
    expect(getModalName()).toBe('RAMPS_ELIGIBILITY_FAILED');
  });

  it('region unsupported → shows RAMPS_UNSUPPORTED', async () => {
    const unsupported: UserRegion = {
      ...region,
      country: { isoCode: 'FR', supported: { buy: false } } as Country,
    };
    const { result, getModalName } = run(
      buildState({
        userRegion: unsupported,
        countries: { ...loaded, data: [unsupported.country as Country] },
      }),
    );
    await goToBuy(result);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
  });

  it('providers fetched but empty → shows RAMPS_UNSUPPORTED', async () => {
    const { result, getModalName } = run(
      buildState({
        providers: { data: [], selected: null, isLoading: false, error: null },
        tokens: {
          data: { topTokens: [], allTokens: [] },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    await goToBuy(result);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
  });

  it('gate passes, no assetId → navigates to token selection', async () => {
    const { result, getModalName } = run(buildState());
    const opened = await goToBuy(result);
    expect(opened).toBe('native');
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: false,
    });
    expect(openTab).not.toHaveBeenCalled();
    expect(mockHasAttemptedPortfolioBuyMigration).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });

  it('replace option → in-app navigations replace instead of push', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    const { result } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [{ assetId, tokenSupported: true } as RampsToken],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );

    await act(async () => {
      await result.current.goToBuy({ assetId }, { replace: true });
    });

    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: true,
    });

    await act(async () => {
      await result.current.goToBuy(undefined, { replace: true });
    });
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: true,
    });
  });

  it('providers fetch errored → fails open and navigates to token selection', async () => {
    const { result, getModalName } = run(
      buildState({
        providers: {
          data: [],
          selected: null,
          isLoading: false,
          error: 'network down',
        },
      }),
    );
    await goToBuy(result);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('tokens fetch errored → fails open and navigates to token selection', async () => {
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: { topTokens: [], allTokens: [] },
          selected: null,
          isLoading: false,
          error: 'network down',
        },
      }),
    );
    await goToBuy(result);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('providers/tokens never fetched (default state) → fails open and navigates', async () => {
    // RampsController's never-fetched default: providers.data === [] and
    // tokens.data === null. This must NOT be treated as "fetched and empty".
    const { result, getModalName } = run(
      buildState({
        providers: { data: [], selected: null, isLoading: false, error: null },
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );
    await goToBuy(result);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE, {
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with supported assetId → pre-selects token and navigates to build quote', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [{ assetId, tokenSupported: true } as RampsToken],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    const opened = await goToBuy(result, { assetId });
    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with assetId when pre-select fails → shows RAMPS_UNSUPPORTED and does not navigate', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    backgroundHandlers.setRampsSelectedToken = () => {
      throw new Error('Token not found');
    };
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [{ assetId, tokenSupported: true } as RampsToken],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    const opened = await goToBuy(result, { assetId });
    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('intent with supported assetId matches case-insensitively', async () => {
    const catalogAssetId = 'eip155:1/erc20:0xAbC';
    const { result } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [
              { assetId: catalogAssetId, tokenSupported: true } as RampsToken,
            ],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    const opened = await goToBuy(result, { assetId: 'eip155:1/erc20:0xabc' });
    expect(opened).toBe('native');
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId: catalogAssetId },
      replace: false,
    });
  });

  it('intent with a checksummed EVM assetId pre-selects the catalog spelling', async () => {
    // Token pages build EVM asset ids from a checksummed address, while the
    // catalog returns some of them lowercased (mUSD). The controller looks up
    // the selected token by exact assetId, so the catalog spelling has to win.
    const catalogAssetId =
      'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da';
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [
              { assetId: catalogAssetId, tokenSupported: true } as RampsToken,
            ],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );

    const opened = await goToBuy(result, {
      assetId: 'eip155:1/erc20:0xACA92E438df0B2401fF60dA7E4337B687a2435DA',
    });

    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      catalogAssetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId: catalogAssetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with affected-network assetId matches a catalog token with checksum casing', async () => {
    const catalogAssetId = 'eip155:59144/erc20:0xAbC';
    const { result } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [
              {
                assetId: catalogAssetId,
                tokenSupported: true,
              } as RampsToken,
            ],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );

    const opened = await goToBuy(result, {
      assetId: 'eip155:59144/erc20:0xabc',
    });

    expect(opened).toBe('native');
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId: catalogAssetId },
      replace: false,
    });
  });

  it('intent with assetId and loading catalog fails open to build quote', async () => {
    const assetId = 'eip155:143/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        providers: {
          data: [],
          selected: null,
          isLoading: true,
          error: null,
        },
        tokens: {
          data: null,
          selected: null,
          isLoading: true,
          error: null,
        },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe('native');
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with assetId absent from a settled catalog → shows RAMPS_UNSUPPORTED', async () => {
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [
              {
                assetId: 'eip155:1/erc20:0xother',
                tokenSupported: true,
              } as RampsToken,
            ],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    const opened = await goToBuy(result, {
      assetId: 'eip155:1/erc20:0xmissing',
    });
    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('intent with assetId flagged tokenSupported:false → shows RAMPS_UNSUPPORTED', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [{ assetId, tokenSupported: false } as RampsToken],
          },
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );
    const opened = await goToBuy(result, { assetId });
    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
  });

  it('cold catalog fetches tokens for the persisted region, then pre-selects and navigates to build quote', async () => {
    // `tokens` is not persisted: after a service-worker restart (the normal
    // state when someone clicks a `/buy` link from email) tokens.data is null
    // and the controller's setSelectedToken throws until tokens are fetched.
    // goToBuy must fetch the catalog first, then pre-select with the freshly
    // fetched catalog's spelling.
    const assetId = 'eip155:1/erc20:0xabc';
    const catalogAssetId = 'eip155:1/erc20:0xABC';
    backgroundHandlers.getRampsTokens = () => ({
      topTokens: [],
      allTokens: [
        { assetId: catalogAssetId, tokenSupported: true } as RampsToken,
      ],
    });
    const { result, getModalName } = run(
      buildState({
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('getRampsTokens', [
      'us',
      'buy',
    ]);
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      catalogAssetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId: catalogAssetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('normalizes the geolocation region when the persisted region is unavailable', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    backgroundHandlers.getRampsTokens = () => ({
      topTokens: [],
      allTokens: [{ assetId, tokenSupported: true } as RampsToken],
    });
    const { result } = run(
      buildState({
        userRegion: null,
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );

    await goToBuy(result, { assetId });

    expect(mockBackground).toHaveBeenCalledWith('getRampsTokens', [
      'us-ca',
      'buy',
    ]);
  });

  it('cold catalog fetch that fails and a controller that cannot pre-select → shows RAMPS_UNSUPPORTED', async () => {
    // Real-controller parity for the deep-link cold start: without a fetched
    // catalog, setSelectedToken throws "Tokens not loaded" — the entry page
    // must surface the unsupported modal rather than navigate.
    const assetId = 'eip155:1/erc20:0xabc';
    backgroundHandlers.getRampsTokens = () => {
      throw new Error('network down');
    };
    backgroundHandlers.setRampsSelectedToken = () => {
      throw new Error(
        'Tokens not loaded. Cannot set selected token before tokens are fetched.',
      );
    };
    const { result, getModalName } = run(
      buildState({
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cold catalog fetch is not gated by the never-fetched providers snapshot', async () => {
    // The service-worker-restart case: the hook's closure still holds the
    // default providers state (data: [], isLoading: false) even while the
    // controller is fetching providers, so the freshly fetched catalog must
    // not be judged "settled empty" by that stale snapshot — the deep link
    // must proceed to build-quote.
    const assetId = 'eip155:1/erc20:0xabc';
    backgroundHandlers.getRampsTokens = () => ({
      topTokens: [],
      allTokens: [{ assetId, tokenSupported: true } as RampsToken],
    });
    const { result, getModalName } = run(
      buildState({
        providers: { data: [], selected: null, isLoading: false, error: null },
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('freshly fetched catalog that lacks the token → shows RAMPS_UNSUPPORTED', async () => {
    // A catalog we just fetched is authoritative: when it definitively does
    // not contain the token, fail closed rather than routing to build-quote
    // with an unresolvable intent.
    const assetId = 'eip155:1/erc20:0xmissing';
    backgroundHandlers.getRampsTokens = () => ({
      topTokens: [],
      allTokens: [
        {
          assetId: 'eip155:1/erc20:0xother',
          tokenSupported: true,
        } as RampsToken,
      ],
    });
    const { result, getModalName } = run(
      buildState({
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe(false);
    expect(getModalName()).toBe('RAMPS_UNSUPPORTED');
  });

  it('intent with assetId but catalog not settled → fails open to build quote', async () => {
    // tokens.data === null and the on-demand fetch resolves without data: the
    // catalog is still unsettled, so fail open and proceed with the token
    // pre-selected rather than blocking.
    const assetId = 'eip155:1/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );
    const opened = await goToBuy(result, { assetId });
    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with a checksummed assetId still uses the catalog spelling while the catalog refreshes', async () => {
    // An unsettled catalog does not gate the buy, but the tokens it already
    // holds are still the best source for the assetId spelling.
    const catalogAssetId =
      'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da';
    const { result } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: [
              { assetId: catalogAssetId, tokenSupported: true } as RampsToken,
            ],
          },
          selected: null,
          isLoading: true,
          error: null,
        },
      }),
    );

    const opened = await goToBuy(result, {
      assetId: 'eip155:1/erc20:0xACA92E438df0B2401fF60dA7E4337B687a2435DA',
    });

    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      catalogAssetId,
    ]);
  });

  it('intent with assetId and incomplete settled catalog → fails open to build quote', async () => {
    const assetId = 'eip155:8453/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        tokens: {
          data: {
            topTokens: [],
            allTokens: undefined,
          } as unknown as TokensResponse,
          selected: null,
          isLoading: false,
          error: null,
        },
      }),
    );

    const opened = await goToBuy(result, { assetId });

    expect(opened).toBe('native');
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
      replace: false,
    });
    expect(getModalName()).toBeNull();
  });
});
