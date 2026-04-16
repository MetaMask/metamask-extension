import { TransactionType } from '@metamask/transaction-controller';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import transactions from '../../../../test/data/transaction-data.json';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../musd/constants';
import {
  mapTransactionTypeToCategory,
  resolveTransactionType,
} from './helpers';

const expectedResults = [
  {
    title: 'Sent',
    category: TransactionGroupCategory.send,
  },
  {
    title: 'Sent',
    category: TransactionGroupCategory.send,
  },
  {
    title: 'Sent',
    category: TransactionGroupCategory.send,
  },
  {
    title: 'Received',
    category: TransactionGroupCategory.receive,
  },
  {
    title: 'Received',
    category: TransactionGroupCategory.receive,
  },
  {
    title: 'Received',
    category: TransactionGroupCategory.receive,
  },
  {
    title: 'Swap ETH to ABC',
    category: TransactionType.swap,
  },
  {
    title: 'Contract deployment',
    category: TransactionGroupCategory.interaction,
  },
  {
    title: 'Safe transfer from',
    category: TransactionGroupCategory.send,
  },
  {
    title: 'Approve ABC spending cap',
    category: TransactionGroupCategory.approval,
  },
  {
    title: 'Sent BAT as ETH',
    category: TransactionType.swapAndSend,
  },
  {
    title: 'Sent USDC as DAI',
    category: TransactionType.swapAndSend,
  },
  {
    title: 'Sent BNB as USDC',
    category: TransactionType.swapAndSend,
  },
  {
    title: 'Sent ABC',
    category: TransactionGroupCategory.send,
  },
];

describe('mapTransactionTypeToCategory', () => {
  it('returns send category for musdConversion', () => {
    expect(mapTransactionTypeToCategory(TransactionType.musdConversion)).toBe(
      TransactionGroupCategory.send,
    );
  });

  it('returns send category for musdClaim', () => {
    expect(mapTransactionTypeToCategory(TransactionType.musdClaim)).toBe(
      TransactionGroupCategory.send,
    );
  });

  it('returns send category for contractInteraction with Merkl distributor and claim method', () => {
    const resolved = resolveTransactionType(
      TransactionType.contractInteraction,
      MERKL_DISTRIBUTOR_ADDRESS,
      '0x71ee95c0abcdef',
    );
    expect(resolved).toBe(TransactionType.musdClaim);
    expect(mapTransactionTypeToCategory(resolved)).toBe(
      TransactionGroupCategory.send,
    );
  });

  it('returns interaction category for contractInteraction with Merkl distributor but wrong method', () => {
    const resolved = resolveTransactionType(
      TransactionType.contractInteraction,
      MERKL_DISTRIBUTOR_ADDRESS,
      '0xdeadbeef',
    );
    expect(resolved).toBe(TransactionType.contractInteraction);
    expect(mapTransactionTypeToCategory(resolved)).toBe(
      TransactionGroupCategory.interaction,
    );
  });

  it('returns interaction category for contractInteraction with Merkl distributor but no data', () => {
    const resolved = resolveTransactionType(
      TransactionType.contractInteraction,
      MERKL_DISTRIBUTOR_ADDRESS,
    );
    expect(resolved).toBe(TransactionType.contractInteraction);
    expect(mapTransactionTypeToCategory(resolved)).toBe(
      TransactionGroupCategory.interaction,
    );
  });

  it('returns interaction category for contractInteraction with a different address', () => {
    const resolved = resolveTransactionType(
      TransactionType.contractInteraction,
      '0x0000000000000000000000000000000000000001',
      '0x71ee95c0abcdef',
    );
    expect(resolved).toBe(TransactionType.contractInteraction);
    expect(mapTransactionTypeToCategory(resolved)).toBe(
      TransactionGroupCategory.interaction,
    );
  });

  it('returns correct categories for transaction types', () => {
    transactions.forEach(({ primaryTransaction }, index) => {
      const transactionType = primaryTransaction.type as TransactionType;

      const result = mapTransactionTypeToCategory(transactionType);

      expect(result).toBe(expectedResults[index].category);
    });
  });
});
