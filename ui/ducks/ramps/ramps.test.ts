import { configureStore, Store } from '@reduxjs/toolkit';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import RampAPI from '../../helpers/ramps/rampApi/rampAPI';
import { getCurrentChainId, getUseExternalServices } from '../../selectors';
import { CHAIN_IDS } from '../../../shared/constants/network';
import mockEntireState from '../../../test/data/mock-state.json';
import { MultichainNativeAssets } from '../../../shared/constants/multichain/assets';
import { getMultichainIsBitcoin } from '../../selectors/multichain';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import rampsReducer, {
  fetchBuyableChains,
  getBuyableChains,
  getIsBitcoinBuyable,
  getIsNativeTokenBuyable,
} from './ramps';
import { defaultBuyableChains } from './constants';

const mockMetaMetricsId = 'deadbeef';
const mockNonEvmBalance = '1';
const mockNonEvmAccount = {
  address: 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  id: '542490c8-d178-433b-9f31-f680b11f45a5',
  metadata: {
    name: 'Bitcoin Account',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'btc-snap-id',
      name: 'btc-snap-name',
    },
  },
  options: {},
  methods: [BtcMethod.SendMany],
  type: BtcAccountType.P2wpkh,
};

const mockMetamaskStore = {
  ...mockEntireState.metamask,
  internalAccounts: {
    accounts: {
      [mockNonEvmAccount.id]: mockNonEvmAccount,
    },
    selectedAccount: mockNonEvmAccount.id,
  },
  // (Multichain) BalancesController
  balances: {
    [mockNonEvmAccount.id]: {
      [MultichainNativeAssets.BITCOIN]: {
        amount: mockNonEvmBalance,
        unit: 'BTC',
      },
    },
  },
  // (Multichain) RatesController
  fiatCurrency: 'usd',
  rates: {
    [Cryptocurrency.Btc]: {
      conversionRate: '1.000',
      conversionDate: 0,
    },
  },
  cryptocurrencies: [Cryptocurrency.Btc],
  // Required, during onboarding, the extension will assume we're in an "EVM context", meaning
  // most multichain selectors will not use non-EVM logic despite having a non-EVM
  // selected account
  completedOnboarding: true,
  // Used when clicking on some buttons
  metaMetricsId: mockMetaMetricsId,
};

jest.mock('../../helpers/ramps/rampApi/rampAPI');
const mockedRampAPI = RampAPI as jest.Mocked<typeof RampAPI>;

jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getCurrentChainId: jest.fn(),
  getUseExternalServices: jest.fn(),
  getNames: jest.fn(),
}));

jest.mock('../../selectors/multichain', () => ({
  ...jest.requireActual('../../selectors/multichain'),
  getMultichainIsBitcoin: jest.fn(),
}));

const placeholderStore = (state = {}) => state;

describe('rampsSlice', () => {
  let store: Store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ramps: rampsReducer,
        metamask: (state) => mockMetamaskStore,
        DNS: placeholderStore,
        activeTab: placeholderStore,
        appState: placeholderStore,
        confirm: placeholderStore,
        confirmAlerts: placeholderStore,
        confirmTransaction: placeholderStore,
        history: placeholderStore,
        localeMessages: placeholderStore,
        send: placeholderStore,
      },
      preloadedState: mockEntireState,
    });
    mockedRampAPI.getNetworks.mockReset();
  });

  it('should set the initial state to defaultBuyableChains', () => {
    const { ramps: rampsState } = store.getState();
    expect(rampsState).toEqual({
      buyableChains: defaultBuyableChains,
    });
  });

  describe('setBuyableChains', () => {
    it('should update the buyableChains state when setBuyableChains is dispatched', () => {
      const mockBuyableChains = [{ chainId: '0x1' }];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(mockBuyableChains);
    });
    it('should disregard invalid array and set buyableChains to default', () => {
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: 'Invalid array',
      });
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });

    it('should disregard empty array and set buyableChains to default', () => {
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: [],
      });
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });

    it('should disregard array with invalid elements and set buyableChains to default', () => {
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: ['some invalid', 'element'],
      });
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });
  });

  describe('getBuyableChains', () => {
    it('returns buyableChains', () => {
      const state = store.getState();
      expect(getBuyableChains(state)).toBe(state.ramps.buyableChains);
    });
  });

  describe('fetchBuyableChains', () => {
    beforeEach(() => {
      // simulate the Basic Functionality Toggle being on
      const getUseExternalServicesMock = jest.mocked(getUseExternalServices);
      getUseExternalServicesMock.mockReturnValue(true);
    });

    it('should call RampAPI.getNetworks when the Basic Functionality Toggle is on', async () => {
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      expect(RampAPI.getNetworks).toHaveBeenCalledTimes(1);
    });

    it('should not call RampAPI.getNetworks when the Basic Functionality Toggle is off', async () => {
      const getUseExternalServicesMock = jest.mocked(getUseExternalServices);
      getUseExternalServicesMock.mockReturnValue(false);

      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());

      expect(RampAPI.getNetworks).not.toHaveBeenCalled();
    });

    it('should update the state with the data that is returned', async () => {
      const mockBuyableChains = [
        {
          active: true,
          chainId: 1,
          chainName: 'Ethereum Mainnet',
          nativeTokenSupported: true,
          shortName: 'Ethereum',
        },
      ];
      jest.spyOn(RampAPI, 'getNetworks').mockResolvedValue(mockBuyableChains);
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(mockBuyableChains);
    });
    it('should set state to defaultBuyableChains when returned networks are undefined', async () => {
      // @ts-expect-error forcing undefined to test the behavior
      jest.spyOn(RampAPI, 'getNetworks').mockResolvedValue(undefined);
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });

    it('should set state to defaultBuyableChains when returned networks are empty', async () => {
      jest.spyOn(RampAPI, 'getNetworks').mockResolvedValue([]);
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });

    it('should set state to defaultBuyableChains when API request fails', async () => {
      jest
        .spyOn(RampAPI, 'getNetworks')
        .mockRejectedValue(new Error('API error'));
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      const { ramps: rampsState } = store.getState();
      expect(rampsState.buyableChains).toEqual(defaultBuyableChains);
    });
  });

  describe('getIsNativeTokenBuyable', () => {
    const getCurrentChainIdMock = jest.mocked(getCurrentChainId);
    const getMultichainIsBitcoinMock = jest.mocked(getMultichainIsBitcoin);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when current chain is buyable', () => {
      getMultichainIsBitcoinMock.mockReturnValue(false);
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.MAINNET);
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toEqual(true);
    });

    it('should return false when current chain is not buyable', () => {
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.GOERLI);
      getMultichainIsBitcoinMock.mockReturnValue(false);
      const mockBuyableChains = [{ chainId: CHAIN_IDS.MAINNET, active: true }];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toBe(false);
    });

    it('should return true when Bitcoin is buyable and current chain is Bitcoin', () => {
      getCurrentChainIdMock.mockReturnValue(MultichainNetworks.BITCOIN);
      getMultichainIsBitcoinMock.mockReturnValue(true);
      const mockBuyableChains = [
        { chainId: MultichainNetworks.BITCOIN, active: true },
      ];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toBe(true);
    });

    it('should return false when Bitcoin is not buyable and current chain is Bitcoin', () => {
      getCurrentChainIdMock.mockReturnValue(MultichainNetworks.BITCOIN);
      getMultichainIsBitcoinMock.mockReturnValue(true);
      const mockBuyableChains = [
        { chainId: MultichainNetworks.BITCOIN, active: false },
      ];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toBe(false);
    });

    it('should return false when buyable chains is a corrupted array', () => {
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.MAINNET);
      getMultichainIsBitcoinMock.mockReturnValue(false);
      const mockCorruptedState = {
        ...store.getState(),
        ramps: {
          buyableChains: [null, null, null],
        },
      };
      expect(getIsNativeTokenBuyable(mockCorruptedState)).toBe(false);
    });
  });

  describe('getIsBitcoinBuyable', () => {
    it('should return false when Bitcoin is not in buyableChains', () => {
      const state = store.getState();
      expect(getIsBitcoinBuyable(state)).toBe(false);
    });

    it('should return true when Bitcoin is in buyableChains and active', () => {
      const mockBuyableChains = [
        { chainId: MultichainNetworks.BITCOIN, active: true },
      ];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const state = store.getState();
      expect(getIsBitcoinBuyable(state)).toBe(true);
    });

    it('should return false when Bitcoin is in buyableChains but not active', () => {
      const mockBuyableChains = [
        { chainId: MultichainNetworks.BITCOIN, active: false },
      ];
      store.dispatch({
        type: 'ramps/setBuyableChains',
        payload: mockBuyableChains,
      });
      const state = store.getState();
      expect(getIsBitcoinBuyable(state)).toBe(false);
    });
  });
});
