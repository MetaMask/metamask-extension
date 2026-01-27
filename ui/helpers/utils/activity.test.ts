import { TransactionType } from '@metamask/transaction-controller';
import { filterTransactionByChain } from './activity';

const CHAIN_IDS = {
  MAINNET: '0x1',
  ARBITRUM: '0xa4b1',
  BASE: '0x2105',
  POLYGON: '0x89',
};

describe('filterTransactionByChain', () => {
  describe('non-PAY transaction types', () => {
    it('returns true when transaction chain is in enabled chains', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.simpleSend,
          chainId: CHAIN_IDS.MAINNET,
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.MAINNET,
        ]),
      ).toBe(true);
    });

    it('returns false when transaction chain is not in enabled chains', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.simpleSend,
          chainId: CHAIN_IDS.MAINNET,
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.ARBITRUM,
        ]),
      ).toBe(false);
    });
  });

  describe('perpsDeposit transactions', () => {
    it('returns true when source chain (metamaskPay.chainId) is in enabled chains', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.perpsDeposit,
          chainId: CHAIN_IDS.ARBITRUM,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [CHAIN_IDS.BASE]),
      ).toBe(true);
    });

    it('returns false when only destination chain (Arbitrum) is enabled', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.perpsDeposit,
          chainId: CHAIN_IDS.ARBITRUM,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.ARBITRUM,
        ]),
      ).toBe(false);
    });

    it('returns true when source chain is enabled even if destination is also enabled', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.perpsDeposit,
          chainId: CHAIN_IDS.ARBITRUM,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.ARBITRUM,
          CHAIN_IDS.BASE,
        ]),
      ).toBe(true);
    });

    it('falls back to destination chain when no metamaskPay.chainId', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.perpsDeposit,
          chainId: CHAIN_IDS.ARBITRUM,
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.ARBITRUM,
        ]),
      ).toBe(true);
    });
  });

  describe('musdConversion transactions', () => {
    it('returns true when transaction chain is in enabled chains', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.musdConversion,
          chainId: CHAIN_IDS.MAINNET,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.MAINNET,
        ]),
      ).toBe(true);
    });

    it('returns true when source chain is in enabled chains', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.musdConversion,
          chainId: CHAIN_IDS.MAINNET,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [CHAIN_IDS.BASE]),
      ).toBe(true);
    });

    it('returns false when neither chain is enabled', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.musdConversion,
          chainId: CHAIN_IDS.MAINNET,
          metamaskPay: {
            chainId: CHAIN_IDS.BASE,
          },
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.POLYGON,
        ]),
      ).toBe(false);
    });

    it('falls back to transaction chain when no metamaskPay.chainId', () => {
      const transactionGroup = {
        initialTransaction: {
          type: TransactionType.musdConversion,
          chainId: CHAIN_IDS.MAINNET,
        },
      };

      expect(
        filterTransactionByChain(transactionGroup as never, [
          CHAIN_IDS.MAINNET,
        ]),
      ).toBe(true);
    });
  });
});
