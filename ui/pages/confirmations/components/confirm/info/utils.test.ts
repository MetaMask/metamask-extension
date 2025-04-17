import { TransactionMeta } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { TransactionDescription } from '@ethersproject/abi';
import {
  getIsRevokeSetApprovalForAll,
  hasValueAndNativeBalanceMismatch,
  isValidUTF8,
} from './utils';

describe('getIsRevokeSetApprovalForAll', () => {
  it('returns false if no data is passed as an argument', () => {
    const testValue = {
      args: {},
    } as TransactionDescription;

    const actual = getIsRevokeSetApprovalForAll(testValue);

    expect(actual).toEqual(false);
  });

  it('returns true if setApprovalForAll decoded tx is passed as an argument', () => {
    const testValue = {
      name: 'setApprovalForAll',
      args: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _approved: false,
      },
    } as unknown as TransactionDescription;

    const actual = getIsRevokeSetApprovalForAll(testValue);

    expect(actual).toEqual(true);
  });
});

describe('hasValueAndNativeBalanceMismatch', () => {
  it('returns false when transaction value matches simulated balance change', () => {
    const transactionValueInDecimal = 10000000000000000;
    const transactionValueInHex = toHex(transactionValueInDecimal);

    const transaction = {
      txParams: {
        value: transactionValueInHex,
      },
      simulationData: {
        nativeBalanceChange: {
          difference: transactionValueInHex,
          isDecrease: true,
        },
      },
    } as unknown as TransactionMeta;

    expect(hasValueAndNativeBalanceMismatch(transaction)).toBe(false);
  });

  it('returns false when values differ within threshold', () => {
    const transactionValueInDecimal = 10000000000000000;
    const transactionValueInHex = toHex(transactionValueInDecimal);

    const differenceInDecimal = 10400000000000000;
    const differenceInHex = toHex(differenceInDecimal);

    const transaction = {
      txParams: {
        value: transactionValueInHex,
      },
      simulationData: {
        nativeBalanceChange: {
          difference: differenceInHex,
          isDecrease: true,
        },
      },
    } as unknown as TransactionMeta;

    expect(hasValueAndNativeBalanceMismatch(transaction)).toBe(false);
  });

  it('returns true when values differ beyond threshold', () => {
    const transactionValueInDecimal = 10000000000000000;
    const transactionValueInHex = toHex(transactionValueInDecimal);

    const differenceInDecimal = 1000000000;
    const muchSmallerDifferenceInHex = toHex(differenceInDecimal);

    const transaction = {
      txParams: {
        value: transactionValueInHex,
      },
      simulationData: {
        nativeBalanceChange: {
          difference: muchSmallerDifferenceInHex,
          isDecrease: true,
        },
      },
    } as unknown as TransactionMeta;

    expect(hasValueAndNativeBalanceMismatch(transaction)).toBe(true);
  });

  it('returns true when no simulation data is present', () => {
    const transactionValueInDecimal = 10000000000000000;
    const transactionValueInHex = toHex(transactionValueInDecimal);

    const transaction = {
      txParams: {
        value: transactionValueInHex,
      },
    } as unknown as TransactionMeta;

    expect(hasValueAndNativeBalanceMismatch(transaction)).toBe(true);
  });

  it('handles case when value is increased in simulation', () => {
    const transactionValueInDecimal = 10000000000000000;
    const transactionValueInHex = toHex(transactionValueInDecimal);

    const differenceInDecimal = 10000000000000000;
    const differenceInHex = toHex(differenceInDecimal);

    const transaction = {
      txParams: {
        value: transactionValueInHex,
      },
      simulationData: {
        nativeBalanceChange: {
          difference: differenceInHex,
          isDecrease: false,
        },
      },
    } as unknown as TransactionMeta;

    expect(hasValueAndNativeBalanceMismatch(transaction)).toBe(true);
  });
});

describe('isValidUTF8', () => {
  it('returns true for valid UTF-8 string', () => {
    expect(isValidUTF8('Hello')).toEqual(true);
    expect(isValidUTF8('\xC3\x28')).toEqual(true);
    expect(isValidUTF8('😀')).toEqual(true);
  });
});
