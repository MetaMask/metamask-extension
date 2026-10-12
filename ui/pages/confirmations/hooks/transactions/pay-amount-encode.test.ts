import {
  beginPayAmountEncode,
  endPayAmountEncode,
  isPayAmountEncodePending,
  resetPayAmountEncodes,
} from './pay-amount-encode';

const TRANSACTION_ID = 'pay-amount-encode';

describe('pay amount encode', () => {
  beforeEach(() => {
    resetPayAmountEncodes();
  });

  it('stays pending until the encode settles', () => {
    const generation = beginPayAmountEncode(TRANSACTION_ID);

    expect(isPayAmountEncodePending(TRANSACTION_ID)).toBe(true);

    endPayAmountEncode(TRANSACTION_ID, generation);

    expect(isPayAmountEncodePending(TRANSACTION_ID)).toBe(false);
  });

  it('keeps a newer amount when an older encode settles', () => {
    const first = beginPayAmountEncode(TRANSACTION_ID);
    const second = beginPayAmountEncode(TRANSACTION_ID);

    endPayAmountEncode(TRANSACTION_ID, first);

    expect(isPayAmountEncodePending(TRANSACTION_ID)).toBe(true);

    endPayAmountEncode(TRANSACTION_ID, second);

    expect(isPayAmountEncodePending(TRANSACTION_ID)).toBe(false);
  });
});
