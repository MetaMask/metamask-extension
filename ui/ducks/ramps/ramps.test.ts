import { configureStore, Store } from '@reduxjs/toolkit';
import RampAPI from '../../helpers/ramps/rampApi/rampAPI';
import { getCurrentChainId } from '../../selectors';
import { CHAIN_IDS } from '../../../shared/constants/network';
import rampsReducer, {
  fetchBuyableChains,
  getBuyableChains,
  getIsNativeTokenBuyable,
} from './ramps';
import { defaultBuyableChains } from './constants';

jest.mock('../../helpers/ramps/rampApi/rampAPI');

jest.mock('../../selectors', () => ({
  getCurrentChainId: jest.fn(),
  getNames: jest.fn(),
}));

describe('rampsSlice', () => {
  let store: Store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ramps: rampsReducer,
      },
    });
    // @ts-expect-error mocked API has mockReset method
    RampAPI.getNetworks.mockReset();
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
    it('should call RampAPI.getNetworks', async () => {
      // @ts-expect-error this is a valid action
      await store.dispatch(fetchBuyableChains());
      expect(RampAPI.getNetworks).toHaveBeenCalledTimes(1);
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

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when current chain is buyable', () => {
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.MAINNET);
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toEqual(true);
    });

    it('should return false when current chain is not buyable', () => {
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.GOERLI);
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toEqual(false);
    });

    it('should return false when current chain is not a valid hex string', () => {
      getCurrentChainIdMock.mockReturnValue('0x');
      const state = store.getState();
      expect(getIsNativeTokenBuyable(state)).toEqual(false);
    });

    it('should return false when buyable chains is a corrupted array', () => {
      const mockState = {
        ramps: {
          buyableChains: [null, null, null],
        },
      };
      getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.MAINNET);
      expect(getIsNativeTokenBuyable(mockState)).toEqual(false);
    });
  });
});
