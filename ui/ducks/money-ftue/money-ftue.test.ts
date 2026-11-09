import type { MetaMaskReduxState } from '../../store/store';
import {
  closeMoneyFtue,
  initialState,
  moneyFtueReducer as reducer,
  openMoneyFtue,
  type MoneyFtueState,
  selectIsMoneyFtueOpen,
  selectMoneyFtuePendingDeposit,
  selectMoneyFtueSource,
  selectHasSeenMoneyFtue,
} from '.';

const preferredPaymentToken = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
  chainId: '0x1' as const,
};

const withState = (moneyFtue: MoneyFtueState): MetaMaskReduxState =>
  ({ moneyFtue }) as unknown as MetaMaskReduxState;

describe('moneyFtue slice', () => {
  it('returns the closed initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialState);
    expect(initialState.isOpen).toBe(false);
    expect(initialState.source).toBeNull();
    expect(initialState.pendingDeposit).toBeNull();
    expect(initialState.acknowledged).toBe(false);
  });

  it('opens for the Money home without a pending deposit', () => {
    const state = reducer(initialState, openMoneyFtue({ source: 'moneyHome' }));

    expect(state).toStrictEqual({
      isOpen: true,
      source: 'moneyHome',
      pendingDeposit: null,
      acknowledged: false,
    });
  });

  it('opens for a deposit and stores the token intent', () => {
    const state = reducer(
      initialState,
      openMoneyFtue({
        source: 'deposit',
        preferredPaymentToken,
        intent: 'addMusd',
      }),
    );

    expect(state).toStrictEqual({
      isOpen: true,
      source: 'deposit',
      pendingDeposit: { preferredPaymentToken, intent: 'addMusd' },
      acknowledged: false,
    });
  });

  it('stores an empty deposit intent when the deposit has no token', () => {
    const state = reducer(initialState, openMoneyFtue({ source: 'deposit' }));

    expect(state).toStrictEqual({
      isOpen: true,
      source: 'deposit',
      pendingDeposit: {},
      acknowledged: false,
    });
  });

  it('keeps the first intent when openMoneyFtue fires while open', () => {
    const opened = reducer(
      initialState,
      openMoneyFtue({
        source: 'deposit',
        preferredPaymentToken,
        intent: 'addMusd',
      }),
    );

    const state = reducer(opened, openMoneyFtue({ source: 'moneyHome' }));

    expect(state).toStrictEqual(opened);
  });

  it('clears the state on closeMoneyFtue', () => {
    const opened = reducer(
      initialState,
      openMoneyFtue({
        source: 'deposit',
        preferredPaymentToken,
        intent: 'addMusd',
      }),
    );

    expect(reducer(opened, closeMoneyFtue())).toStrictEqual({
      ...initialState,
      acknowledged: true,
    });
  });
});

describe('moneyFtue selectors', () => {
  it('reads the open, source and pending deposit values', () => {
    const state = withState({
      isOpen: true,
      source: 'deposit',
      pendingDeposit: { preferredPaymentToken, intent: 'addMusd' },
      acknowledged: false,
    });

    expect(selectIsMoneyFtueOpen(state)).toBe(true);
    expect(selectMoneyFtueSource(state)).toBe('deposit');
    expect(selectMoneyFtuePendingDeposit(state)).toStrictEqual({
      preferredPaymentToken,
      intent: 'addMusd',
    });
  });

  it('tolerates a missing slice', () => {
    const state = {} as MetaMaskReduxState;

    expect(selectIsMoneyFtueOpen(state)).toBe(false);
    expect(selectMoneyFtueSource(state)).toBeNull();
    expect(selectMoneyFtuePendingDeposit(state)).toBeNull();
  });

  it('treats either the persisted flag or the session acknowledgement as seen', () => {
    const persistedSeen = {
      metamask: { moneyFtueSeen: true },
      moneyFtue: initialState,
    } as unknown as MetaMaskReduxState;
    const acknowledged = {
      metamask: { moneyFtueSeen: false },
      moneyFtue: { ...initialState, acknowledged: true },
    } as unknown as MetaMaskReduxState;
    const unseen = {
      metamask: { moneyFtueSeen: false },
      moneyFtue: initialState,
    } as unknown as MetaMaskReduxState;

    expect(selectHasSeenMoneyFtue(persistedSeen)).toBe(true);
    expect(selectHasSeenMoneyFtue(acknowledged)).toBe(true);
    expect(selectHasSeenMoneyFtue(unseen)).toBe(false);
  });
});
