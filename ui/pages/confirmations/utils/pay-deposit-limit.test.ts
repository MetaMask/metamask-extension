import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getDepositLimitForTransaction,
  getDepositLimits,
  PAY_DEPOSIT_LIMITS_DEFAULT,
} from './pay-deposit-limit';

/* eslint-disable @typescript-eslint/naming-convention */
function buildSource(depositLimit?: Record<string, number>) {
  return {
    remoteFeatureFlags: {
      confirmations_pay_extended: {
        depositLimit,
      },
    },
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

describe('getDepositLimits', () => {
  it('returns the default empty map when remote flags are missing', () => {
    expect(getDepositLimits({})).toStrictEqual(PAY_DEPOSIT_LIMITS_DEFAULT);
  });

  it('returns the default empty map when depositLimit is absent', () => {
    expect(getDepositLimits(buildSource(undefined))).toStrictEqual(
      PAY_DEPOSIT_LIMITS_DEFAULT,
    );
  });

  it('returns deposit limits from the feature flag', () => {
    expect(
      getDepositLimits(
        buildSource({
          moneyAccountDeposit: 100000,
        }),
      ),
    ).toStrictEqual({
      moneyAccountDeposit: 100000,
    });
  });

  it('returns multiple deposit type limits', () => {
    expect(
      getDepositLimits(
        buildSource({
          moneyAccountDeposit: 100000,
          perpsDeposit: 25000,
        }),
      ),
    ).toStrictEqual({
      moneyAccountDeposit: 100000,
      perpsDeposit: 25000,
    });
  });
});

describe('getDepositLimitForTransaction', () => {
  it('returns the limit matching the transaction type', () => {
    expect(
      getDepositLimitForTransaction(
        {
          moneyAccountDeposit: 100000,
          perpsDeposit: 25000,
        },
        { type: TransactionType.perpsDeposit } as TransactionMeta,
      ),
    ).toBe(25000);
  });

  it('returns undefined when the transaction type has no limit', () => {
    expect(
      getDepositLimitForTransaction({ moneyAccountDeposit: 100000 }, {
        type: TransactionType.simpleSend,
      } as TransactionMeta),
    ).toBeUndefined();
  });

  it('returns undefined when the limits map is empty', () => {
    expect(
      getDepositLimitForTransaction({}, {
        type: TransactionType.moneyAccountDeposit,
      } as TransactionMeta),
    ).toBeUndefined();
  });
});
