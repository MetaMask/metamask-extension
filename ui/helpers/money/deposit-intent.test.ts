import {
  clearMoneyAccountDepositIntent,
  getMoneyAccountDepositIntent,
  setMoneyAccountDepositIntent,
} from './deposit-intent';

const BATCH_ID = '0xABCDEF0123456789';

describe('money account deposit intent map', () => {
  afterEach(() => {
    clearMoneyAccountDepositIntent(BATCH_ID);
  });

  it('round-trips an intent case-insensitively on the batch id', () => {
    setMoneyAccountDepositIntent(BATCH_ID, 'addMusd');

    expect(getMoneyAccountDepositIntent(BATCH_ID.toLowerCase())).toBe(
      'addMusd',
    );
    expect(getMoneyAccountDepositIntent(BATCH_ID.toUpperCase())).toBe(
      'addMusd',
    );
  });

  it('returns undefined for an unset batch id', () => {
    expect(getMoneyAccountDepositIntent('0x0000')).toBeUndefined();
  });

  it('returns undefined for a missing batch id', () => {
    expect(getMoneyAccountDepositIntent(undefined)).toBeUndefined();
  });

  it('clears a recorded intent', () => {
    setMoneyAccountDepositIntent(BATCH_ID, 'card');
    clearMoneyAccountDepositIntent(BATCH_ID);

    expect(getMoneyAccountDepositIntent(BATCH_ID)).toBeUndefined();
  });

  it('ignores set and clear for a missing batch id', () => {
    expect(() => {
      setMoneyAccountDepositIntent(undefined, 'convert');
      clearMoneyAccountDepositIntent(undefined);
    }).not.toThrow();
  });
});
