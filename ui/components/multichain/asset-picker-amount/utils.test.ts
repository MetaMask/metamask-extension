import configureStore from '../../../store/store';
import mockSendState from '../../../../test/data/mock-send-state.json';
import { getIsFiatPrimary } from './utils';

const createStore = ({
  useNativeCurrencyAsPrimaryCurrency,
  sendInputCurrencySwitched,
}: Record<string, boolean>) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
      preferences: { useNativeCurrencyAsPrimaryCurrency },
    },
    appState: { ...mockSendState.appState, sendInputCurrencySwitched },
  });

describe('getIsFiatPrimary selector', () => {
  it('returns true when useNativeCurrencyAsPrimaryCurrency and sendInputCurrencySwitched are both true', () => {
    const store = createStore({
      useNativeCurrencyAsPrimaryCurrency: true,
      sendInputCurrencySwitched: true,
    });

    const state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(true);
  });

  it('returns true when useNativeCurrencyAsPrimaryCurrency and sendInputCurrencySwitched are both false', () => {
    const store = createStore({
      useNativeCurrencyAsPrimaryCurrency: false,
      sendInputCurrencySwitched: false,
    });
    const state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(true);
  });

  it('returns false when useNativeCurrencyAsPrimaryCurrency and sendInputCurrencySwitched have different values', () => {
    let store = createStore({
      useNativeCurrencyAsPrimaryCurrency: true,
      sendInputCurrencySwitched: false,
    });

    let state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(false);

    store = createStore({
      useNativeCurrencyAsPrimaryCurrency: false,
      sendInputCurrencySwitched: true,
    });

    state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(false);
  });
});
