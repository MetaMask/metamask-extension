import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../multichain/types';
import { CHAIN_IDS } from '../../../constants/network';
import { GAS_FEE_SPONSORED } from '../fees';
import { getLocalTransactionFees } from './helpers';

function buildTransactionGroup(
  overrides: Partial<TransactionGroup['primaryTransaction']> = {},
): TransactionGroup {
  const transaction = {
    chainId: CHAIN_IDS.MAINNET,
    status: TransactionStatus.confirmed,
    type: TransactionType.swap,
    txParams: {
      gasPrice: '0x2',
    },
    txReceipt: {
      gasUsed: '0x3',
      effectiveGasPrice: '0x2',
    },
    ...overrides,
  } as TransactionGroup['primaryTransaction'];

  return {
    hasCancelled: false,
    hasRetried: false,
    initialTransaction: transaction,
    nonce: '0x1',
    primaryTransaction: transaction,
    transactions: [transaction],
  };
}

describe('getLocalTransactionFees', () => {
  it('returns the calculated network fee for non-sponsored transactions', () => {
    expect(getLocalTransactionFees(buildTransactionGroup())).toStrictEqual([
      expect.objectContaining({
        amount: '6',
        type: 'base',
      }),
    ]);
  });

  it('returns a sponsored network fee marker for gas-sponsored transactions', () => {
    expect(
      getLocalTransactionFees(
        buildTransactionGroup({
          isGasFeeSponsored: true,
        }),
      ),
    ).toStrictEqual([
      {
        type: GAS_FEE_SPONSORED,
      },
    ]);
  });

  it('does not return a sponsored marker for failed sponsored transactions without a receipt', () => {
    expect(
      getLocalTransactionFees(
        buildTransactionGroup({
          isGasFeeSponsored: true,
          status: TransactionStatus.failed,
          txReceipt: undefined,
        }),
      ),
    ).toBeUndefined();
  });
});
