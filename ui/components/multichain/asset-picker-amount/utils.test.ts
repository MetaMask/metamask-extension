import configureStore from '../../../store/store';
import mockSendState from '../../../../test/data/mock-send-state.json';
import { getIsFiatPrimary } from './utils';

const createStore = ({ sendInputCurrencySwitched }: Record<string, boolean>) =>
  configureStore({
    ...mockSendState,
    metamask: {
      ...mockSendState.metamask,
    },
    appState: { ...mockSendState.appState, sendInputCurrencySwitched },
  });

describe('getIsFiatPrimary selector', () => {
  it('returns true when sendInputCurrencySwitched is true', () => {
    const store = createStore({
      sendInputCurrencySwitched: true,
    });

    const state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(true);
  });

  it('returns false when sendInputCurrencySwitched is false', () => {
    const store = createStore({
      sendInputCurrencySwitched: false,
    });
    const state = store.getState();
    expect(getIsFiatPrimary(state as never)).toBe(false);
  });
});
