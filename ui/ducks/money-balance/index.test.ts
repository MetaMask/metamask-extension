import reducer, {
  initialState,
  setLastKnownMoneyBalance,
  clearLastKnownMoneyBalance,
  type MoneyBalanceState,
  type PersistedMoneyBalance,
} from '.';

const balance: PersistedMoneyBalance = {
  address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  value: '$2,384.34',
  updatedAt: 1700000000000,
};

describe('moneyBalance slice', () => {
  it('returns the initial state, with no last known balance', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialState);
    expect(initialState.lastKnownBalance).toBeNull();
  });

  it('stores the balance on setLastKnownMoneyBalance', () => {
    const state = reducer(initialState, setLastKnownMoneyBalance(balance));

    expect(state.lastKnownBalance).toStrictEqual(balance);
  });

  it('replaces a previously stored balance on setLastKnownMoneyBalance', () => {
    const populated: MoneyBalanceState = { lastKnownBalance: balance };
    const newer: PersistedMoneyBalance = {
      ...balance,
      value: '$2,400.00',
      updatedAt: balance.updatedAt + 60_000,
    };

    const state = reducer(populated, setLastKnownMoneyBalance(newer));

    expect(state.lastKnownBalance).toStrictEqual(newer);
  });

  it('resets the balance to null on clearLastKnownMoneyBalance', () => {
    const populated: MoneyBalanceState = { lastKnownBalance: balance };

    const state = reducer(populated, clearLastKnownMoneyBalance());

    expect(state.lastKnownBalance).toBeNull();
  });
});
