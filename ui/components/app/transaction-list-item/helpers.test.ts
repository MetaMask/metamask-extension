import { TransactionType } from '@metamask/transaction-controller';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import transactions from '../../../../test/data/transaction-data.json';
import { mapTransactionTypeToCategory } from './helpers';

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
  it('returns correct categories for transaction types', () => {
    transactions.forEach(({ primaryTransaction }, index) => {
      const transactionType = primaryTransaction.type as TransactionType;

      const result = mapTransactionTypeToCategory(transactionType);

      expect(result).toBe(expectedResults[index].category);
    });
  });

  it('returns interaction category for unknown transaction types', () => {
    // Test with an unknown/unsupported transaction type
    const unknownType = 'unknownTransactionType' as TransactionType;

    const result = mapTransactionTypeToCategory(unknownType);

    expect(result).toBe(TransactionGroupCategory.interaction);
  });

  it('returns signatureRequest category for null transaction type', () => {
    // Null should return signatureRequest based on the switch case
    const result = mapTransactionTypeToCategory(null as TransactionType);

    expect(result).toBe(TransactionGroupCategory.signatureRequest);
  });

  it('returns signatureRequest category for undefined transaction type', () => {
    // Undefined should return signatureRequest based on the switch case
    const result = mapTransactionTypeToCategory(undefined as TransactionType);

    expect(result).toBe(TransactionGroupCategory.signatureRequest);
  });
});
