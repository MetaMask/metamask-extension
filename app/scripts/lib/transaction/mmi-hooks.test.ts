import { TransactionStatus } from '@metamask/transaction-controller';
import {
  afterTransactionSign,
  beforeCheckPendingTransaction,
  beforeTransactionApproveOnInit,
  beforeTransactionPublish,
  getAdditionalSignArguments,
} from './mmi-hooks';

describe('MMI hooks', () => {
  const fromMocked = '0xc684832530fcbddae4b4230a47e991ddcec2831d';
  const toMocked = '0xc684832530fcbddae4b4230a47e991ddcec2831d';
  const custodyIdMocked = '123';
  describe('afterTransactionSign', () => {
    it('returns false if txMeta has no custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { to: toMocked } as any;
      const signedEthTx = {};
      const result = afterTransactionSign(txMeta, signedEthTx, jest.fn());
      expect(result).toBe(true);
    });

    it('returns true if txMeta has custodyStatus', () => {
      const txMeta = {
        custodyStatus: TransactionStatus.approved,
        custodyId: custodyIdMocked,
        txParams: { from: fromMocked },
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const signedEthTx = {
        custodian_transactionId: custodyIdMocked,
        transactionStatus: TransactionStatus.signed,
      };
      const addTransactionToWatchList = jest.fn();
      const result = afterTransactionSign(
        txMeta,
        signedEthTx,
        addTransactionToWatchList,
      );
      expect(result).toBe(false);
      expect(txMeta.custodyId).toBe(custodyIdMocked);
      expect(txMeta.custodyStatus).toBe(TransactionStatus.signed);
      expect(addTransactionToWatchList).toHaveBeenCalledWith(
        custodyIdMocked,
        fromMocked,
      );
    });
  });

  describe('beforeTransactionPublish', () => {
    it('returns true if txMeta has custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { custodyStatus: TransactionStatus.approved } as any;
      const result = beforeTransactionPublish(txMeta);
      expect(result).toBe(false);
    });

    it('returns false if txMeta has no custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { to: toMocked } as any;
      const result = beforeTransactionPublish(txMeta);
      expect(result).toBe(true);
    });
  });

  describe('getAdditionalSignArguments', () => {
    it('returns an array with txMeta when custodyStatus is truthy', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { custodyStatus: TransactionStatus.approved } as any;
      const result = getAdditionalSignArguments(txMeta);
      expect(result).toEqual([txMeta]);
    });

    it('returns an empty array when custodyStatus is falsy', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { to: toMocked } as any;
      const result = getAdditionalSignArguments(txMeta);
      expect(result).toEqual([]);
    });
  });

  describe('beforeTransactionApproveOnInit', () => {
    it('returns true if txMeta has custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { custodyStatus: TransactionStatus.approved } as any;
      const result = beforeTransactionApproveOnInit(txMeta);
      expect(result).toBe(false);
    });

    it('returns false if txMeta has no custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { to: toMocked } as any;
      const result = beforeTransactionApproveOnInit(txMeta);
      expect(result).toBe(true);
    });
  });

  describe('beforeCheckPendingTransaction', () => {
    it('returns true if txMeta has custodyStatus', () => {
      const txMeta = {
        custodyStatus: TransactionStatus.approved,
        custodyId: 1,
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const result = beforeCheckPendingTransaction(txMeta);
      expect(result).toBe(false);
    });

    it('returns false if txMeta has no custodyStatus', () => {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txMeta = { to: toMocked } as any;
      const result = beforeCheckPendingTransaction(txMeta);
      expect(result).toBe(true);
    });
  });
});
