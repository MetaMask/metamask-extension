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
import { submitRequestToBackground } from '../../../store/background-connection';
import useRampsNavigation from './useRampsNavigation';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockGetGeolocation = submitRequestToBackground as jest.Mock;
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
  // ponytail: assert on the resulting modal state rather than spying on
  // `store.dispatch` — `useDispatch()` captures the store's dispatch
  // reference at render time, before a post-render `jest.spyOn` swap would
  // apply, so a dispatch spy set up after render never observes the call.
  const getModalName = () => store.getState().appState.modal.modalState.name;
  return { result, getModalName };
};

const goToBuy = async (result: {
  current: ReturnType<typeof useRampsNavigation>;
}): Promise<boolean | undefined> => {
  let opened: boolean | undefined;
  await act(async () => {
    opened = await result.current.goToBuy('0x1');
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

  it('supported + providers → proceeds (opens Portfolio for now)', async () => {
    const { result } = run(buildState());
    const opened = await goToBuy(result);
    expect(opened).toBe(true);
    expect(openTab).toHaveBeenCalled();
  });

  it('providers/tokens never fetched (default state) → fails open and proceeds', async () => {
    // RampsController's never-fetched default: providers.data === [] and
    // tokens.data === null. This must NOT be treated as "fetched and empty".
    const { result, getModalName } = run(
      buildState({
        providers: { data: [], selected: null, isLoading: false, error: null },
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );
    await goToBuy(result);
    expect(openTab).toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });
});
