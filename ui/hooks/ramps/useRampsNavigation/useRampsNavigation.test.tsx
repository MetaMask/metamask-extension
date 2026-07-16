import type {
  Country,
  Provider,
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
import useRampsNavigation, { type RampIntent } from './useRampsNavigation';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockBackground = submitRequestToBackground as jest.Mock;
// `submitRequestToBackground` backs both the geolocation lookup and
// `setRampsSelectedToken`; the geolocation result is what the gate reads.
const mockGetGeolocation = mockBackground;
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

type MetamaskOverrides = Partial<{
  remoteFeatureFlags: {
    rampsEnabled: boolean;
    rampsServiceDisruption: boolean;
  };
  userRegion: UserRegion | null;
  countries: ResourceState<Country[]>;
  providers: ResourceState<Provider[], Provider | null>;
  tokens: ResourceState<TokensResponse | null, RampsToken | null>;
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
    ...over,
  },
});

const run = (state: ReturnType<typeof buildState>) => {
  const { result, store } = renderHookWithProvider(
    () => useRampsNavigation(),
    state,
  );
  // Assert on the resulting modal state rather than spying on
  // `store.dispatch` — `useAppDispatch()` captures the store's dispatch
  // reference at render time, before a post-render `jest.spyOn` swap would
  // apply, so a dispatch spy set up after render never observes the call.
  const getModalName = () => store.getState().appState.modal.modalState.name;
  return { result, getModalName };
};

const goToBuy = async (
  result: { current: ReturnType<typeof useRampsNavigation> },
  intent: RampIntent = { chainId: '0x1' },
): Promise<boolean | undefined> => {
  let opened: boolean | undefined;
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
  // Default: geolocation resolves to a known location so the geo-unknown gate
  // passes and later gates are exercised.
  mockGetGeolocation.mockResolvedValue('US-CA');
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
    await goToBuy(result);
    expect(openTab).toHaveBeenCalled();
    expect(mockGetGeolocation).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
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
    expect(opened).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE);
    expect(openTab).not.toHaveBeenCalled();
    expect(getModalName()).toBeNull();
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
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE);
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
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE);
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
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_TOKEN_SELECTION_ROUTE);
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
    expect(opened).toBe(true);
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
    });
    expect(getModalName()).toBeNull();
  });

  it('intent with assetId when pre-select fails → shows RAMPS_UNSUPPORTED and does not navigate', async () => {
    const assetId = 'eip155:1/erc20:0xabc';
    mockBackground.mockImplementation(async (method: string) => {
      if (method === 'getGeolocation') {
        return 'US-CA';
      }
      if (method === 'setRampsSelectedToken') {
        throw new Error('Token not found');
      }
      return undefined;
    });
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
    expect(opened).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId: 'eip155:1/erc20:0xabc' },
    });
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

  it('intent with assetId but catalog not settled → fails open to build quote', async () => {
    // tokens.data === null (never fetched): cannot verify the token, so fail
    // open and proceed with it pre-selected rather than blocking.
    const assetId = 'eip155:1/erc20:0xabc';
    const { result, getModalName } = run(
      buildState({
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );
    const opened = await goToBuy(result, { assetId });
    expect(opened).toBe(true);
    expect(mockBackground).toHaveBeenCalledWith('setRampsSelectedToken', [
      assetId,
    ]);
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_BUILD_QUOTE_ROUTE, {
      state: { assetId },
    });
    expect(getModalName()).toBeNull();
  });
});
