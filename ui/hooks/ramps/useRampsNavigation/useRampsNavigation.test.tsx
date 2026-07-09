import type {
  Country,
  Provider,
  RampsToken,
  ResourceState,
  TokensResponse,
  UserRegion,
} from '@metamask/ramps-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import useRampsNavigation from './useRampsNavigation';

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
  remoteFeatureFlags: { rampsEnabled: boolean; rampsServiceDisruption: boolean };
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
    providers: { data: [{ id: 'p' } as Provider], selected: null, isLoading: false, error: null },
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

beforeAll(() => {
  Object.defineProperty(global, 'platform', {
    value: { openTab },
  });
});

beforeEach(() => jest.clearAllMocks());

describe('useRampsNavigation goToBuy', () => {
  it('flag off → opens Portfolio (no modal)', () => {
    const { result, getModalName } = run(
      buildState({
        remoteFeatureFlags: { rampsEnabled: false, rampsServiceDisruption: false },
      }),
    );
    result.current.goToBuy('0x1');
    expect(openTab).toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });

  it('geolocation unknown → shows RAMPS_ELIGIBILITY_FAILED', () => {
    // Countries must have actually loaded (non-empty data) with region still
    // null for step 1 to legitimately fire; empty/never-fetched countries
    // must fail open (see ui/selectors/ramps.ts getIsRampsGeolocationUnknown).
    const { result, getModalName } = run(
      buildState({
        userRegion: null,
        countries: { ...loaded, data: [region.country] },
      }),
    );
    result.current.goToBuy('0x1');
    expect(getModalName()).toBe('RAMPS_ELIGIBILITY_FAILED');
    expect(openTab).not.toHaveBeenCalled();
  });

  it('service disruption → shows RAMPS_SERVICE_DISRUPTION', () => {
    const { result, getModalName } = run(
      buildState({
        remoteFeatureFlags: { rampsEnabled: true, rampsServiceDisruption: true },
      }),
    );
    result.current.goToBuy('0x1');
    expect(getModalName()).toBe('RAMPS_SERVICE_DISRUPTION');
  });

  it('region unsupported → shows RAMP_UNSUPPORTED', () => {
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
    result.current.goToBuy('0x1');
    expect(getModalName()).toBe('RAMP_UNSUPPORTED');
  });

  it('providers fetched but empty → shows RAMP_UNSUPPORTED', () => {
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
    result.current.goToBuy('0x1');
    expect(getModalName()).toBe('RAMP_UNSUPPORTED');
  });

  it('supported + providers → proceeds (opens Portfolio for now)', () => {
    const { result } = run(buildState());
    result.current.goToBuy('0x1');
    expect(openTab).toHaveBeenCalled();
  });

  it('providers/tokens never fetched (default state) → fails open and proceeds', () => {
    // RampsController's never-fetched default: providers.data === [] and
    // tokens.data === null. This must NOT be treated as "fetched and empty".
    const { result, getModalName } = run(
      buildState({
        providers: { data: [], selected: null, isLoading: false, error: null },
        tokens: { data: null, selected: null, isLoading: false, error: null },
      }),
    );
    result.current.goToBuy('0x1');
    expect(openTab).toHaveBeenCalled();
    expect(getModalName()).toBeNull();
  });
});
