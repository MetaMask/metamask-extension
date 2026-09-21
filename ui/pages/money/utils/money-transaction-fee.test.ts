import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getMoneyGasFeeUsd,
  getMoneyPayFeeUsd,
  getMoneyTransactionFeeUsd,
  getMoneyTransactionTotalUsd,
  isMoneyNetworkFeePaidByMetaMask,
} from './money-transaction-fee';

function createTransaction(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    chainId: '0x1',
    id: 'money-transaction',
    networkClientId: 'mainnet',
    time: 0,
    txParams: {
      from: '0x0000000000000000000000000000000000000001',
    },
    ...overrides,
  } as TransactionMeta;
}

describe('getMoneyPayFeeUsd', () => {
  it('adds the network and provider fees', () => {
    const tx = createTransaction({
      metamaskPay: {
        networkFeeFiat: '0.12',
        bridgeFeeFiat: '0.04',
      },
    });

    expect(getMoneyPayFeeUsd(tx)).toBe(0.16);
  });

  it('returns zero for a sponsored transaction', () => {
    const tx = createTransaction({
      metamaskPay: {
        networkFeeFiat: '0',
        bridgeFeeFiat: '0',
      },
    });

    expect(getMoneyPayFeeUsd(tx)).toBe(0);
  });

  it('keeps a valid provider fee when the network fee is invalid', () => {
    const tx = createTransaction({
      metamaskPay: {
        networkFeeFiat: 'invalid',
        bridgeFeeFiat: '0.04',
      },
    });

    expect(getMoneyPayFeeUsd(tx)).toBe(0.04);
  });
});

describe('getMoneyGasFeeUsd', () => {
  it('converts used gas and the effective gas price to USD', () => {
    const tx = createTransaction({
      txParams: {
        from: '0x0000000000000000000000000000000000000001',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyGasFeeUsd(tx, 2000)).toBe(0.84);
  });

  it('returns undefined when gas data is unavailable', () => {
    expect(getMoneyGasFeeUsd(createTransaction(), 2000)).toBeUndefined();
  });

  it('returns undefined when the native token rate is unavailable', () => {
    const tx = createTransaction({
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyGasFeeUsd(tx, undefined)).toBeUndefined();
  });

  it('includes the L1 fee in the USD gas cost', () => {
    const tx = createTransaction({
      txParams: {
        from: '0x0000000000000000000000000000000000000001',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
        l1Fee: '0x38d7ea4c68000',
      },
    });

    expect(getMoneyGasFeeUsd(tx, 2000)).toBe(2.84);
  });
});

describe('getMoneyTransactionFeeUsd', () => {
  it('prefers the MetaMask Pay fee over the gas fallback', () => {
    const tx = createTransaction({
      metamaskPay: {
        networkFeeFiat: '0.12',
        bridgeFeeFiat: '0.04',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0.16);
  });

  it('falls back to the receipt gas cost', () => {
    const tx = createTransaction({
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0.84);
  });

  it('adds a provider fee to the receipt gas fallback', () => {
    const tx = createTransaction({
      metamaskPay: {
        bridgeFeeFiat: '0.04',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0.88);
  });

  it('keeps recorded source network fee when the parent tx is gas-sponsored', () => {
    const tx = createTransaction({
      isGasFeeSponsored: true,
      metamaskPay: {
        networkFeeFiat: '0.12',
        bridgeFeeFiat: '0.04',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0.16);
  });

  it('does not fall back to receipt gas when the network fee is sponsored', () => {
    const tx = createTransaction({
      isGasFeeSponsored: true,
      metamaskPay: {
        bridgeFeeFiat: '0.14',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0.14);
  });

  it('returns zero when sponsored with zero source and provider fees', () => {
    const tx = createTransaction({
      isGasFeeSponsored: true,
      metamaskPay: {
        networkFeeFiat: '0',
        bridgeFeeFiat: '0',
      },
      txReceipt: {
        gasUsed: '0x5208',
        effectiveGasPrice: '0x4a817c800',
      },
    });

    expect(getMoneyTransactionFeeUsd(tx, 2000)).toBe(0);
  });
});

describe('isMoneyNetworkFeePaidByMetaMask', () => {
  it('returns true when the transaction is gas-fee sponsored', () => {
    const tx = createTransaction({ isGasFeeSponsored: true });
    expect(isMoneyNetworkFeePaidByMetaMask(tx)).toBe(true);
  });

  it('returns false when the transaction is not gas-fee sponsored', () => {
    const tx = createTransaction({ isGasFeeSponsored: false });
    expect(isMoneyNetworkFeePaidByMetaMask(tx)).toBe(false);
  });
});

describe('getMoneyTransactionTotalUsd', () => {
  it('returns the pay total for a deposit', () => {
    const tx = createTransaction({
      type: TransactionType.moneyAccountDeposit,
      metamaskPay: {
        totalFiat: '1000.16',
      },
    });

    expect(getMoneyTransactionTotalUsd(tx)).toBe(1000.16);
  });

  it('returns the target total for a withdrawal', () => {
    const tx = createTransaction({
      type: TransactionType.moneyAccountWithdraw,
      metamaskPay: {
        totalFiat: '250.16',
        targetFiat: '250',
      },
    });

    expect(getMoneyTransactionTotalUsd(tx)).toBe(250);
  });

  it('returns the target total for a nested withdrawal', () => {
    const tx = createTransaction({
      type: TransactionType.contractInteraction,
      nestedTransactions: [
        {
          type: TransactionType.moneyAccountWithdraw,
        },
      ] as TransactionMeta['nestedTransactions'],
      metamaskPay: {
        totalFiat: '250.16',
        targetFiat: '250',
      },
    });

    expect(getMoneyTransactionTotalUsd(tx)).toBe(250);
  });
});
