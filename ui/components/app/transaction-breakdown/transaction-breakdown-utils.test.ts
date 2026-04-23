import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { getTransactionBreakdownData } from './transaction-breakdown-utils';

jest.mock('../../../selectors', () => ({
  getShouldShowFiat: () => false,
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getNativeCurrency: () => 'ETH',
}));

const BASE_TX: TransactionMeta = {
  id: 'test-tx',
  status: TransactionStatus.confirmed,
  time: Date.now(),
  chainId: '0x1',
  txParams: {
    from: '0x1',
    gas: '0x5208',
    gasPrice: '0x4a817c800',
    value: '0xde0b6b3a7640000',
  },
  isGasFeeSponsored: true,
} as unknown as TransactionMeta;

const MOCK_STATE = { metamask: {} } as never;

describe('getTransactionBreakdownData', () => {
  it('returns isGasFeeSponsored true for confirmed tx with sponsored flag', () => {
    const result = getTransactionBreakdownData({
      state: MOCK_STATE,
      transaction: {
        ...BASE_TX,
        status: TransactionStatus.confirmed,
        isGasFeeSponsored: true,
        txReceipt: { gasUsed: '0x5208' } as TransactionMeta['txReceipt'],
      } as TransactionMeta,
      isTokenApprove: false,
      isHardwareWalletAccount: false,
    });

    expect(result.isGasFeeSponsored).toBe(true);
  });

  it('returns isGasFeeSponsored false for rejected tx even when flag is true', () => {
    const result = getTransactionBreakdownData({
      state: MOCK_STATE,
      transaction: {
        ...BASE_TX,
        status: TransactionStatus.rejected,
        isGasFeeSponsored: true,
      } as TransactionMeta,
      isTokenApprove: false,
      isHardwareWalletAccount: false,
    });

    expect(result.isGasFeeSponsored).toBe(false);
  });

  it('returns isGasFeeSponsored false for failed tx without receipt', () => {
    const result = getTransactionBreakdownData({
      state: MOCK_STATE,
      transaction: {
        ...BASE_TX,
        status: TransactionStatus.failed,
        isGasFeeSponsored: true,
      } as TransactionMeta,
      isTokenApprove: false,
      isHardwareWalletAccount: false,
    });

    expect(result.isGasFeeSponsored).toBe(false);
  });

  it('returns isGasFeeSponsored true for failed tx with gasUsed in receipt', () => {
    const result = getTransactionBreakdownData({
      state: MOCK_STATE,
      transaction: {
        ...BASE_TX,
        status: TransactionStatus.failed,
        isGasFeeSponsored: true,
        txReceipt: { gasUsed: '0x5208' } as TransactionMeta['txReceipt'],
      } as TransactionMeta,
      isTokenApprove: false,
      isHardwareWalletAccount: false,
    });

    expect(result.isGasFeeSponsored).toBe(true);
  });

  it('returns isGasFeeSponsored false when flag is not set', () => {
    const result = getTransactionBreakdownData({
      state: MOCK_STATE,
      transaction: {
        ...BASE_TX,
        isGasFeeSponsored: undefined,
      } as TransactionMeta,
      isTokenApprove: false,
      isHardwareWalletAccount: false,
    });

    expect(result.isGasFeeSponsored).toBeFalsy();
  });
});
