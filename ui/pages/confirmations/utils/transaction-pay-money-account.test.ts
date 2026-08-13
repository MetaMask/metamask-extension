import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { setPaymentOverride } from '../../../store/controller-actions/transaction-pay-controller';
import {
  applyMoneyAccountOverride,
  clearPaymentOverride,
} from './transaction-pay';

jest.mock(
  '../../../store/controller-actions/transaction-pay-controller',
  () => ({
    setPaymentOverride: jest.fn().mockResolvedValue(undefined),
  }),
);

describe('money account payment override helpers', () => {
  const setPaymentOverrideMock = jest.mocked(setPaymentOverride);
  const moneyAddress = '0xc4ff9e84b5754570812d891ade0bad3952bb5946' as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyMoneyAccountOverride', () => {
    it('sets MoneyAccount override and refundTo for deposit flows', () => {
      applyMoneyAccountOverride('tx-1', moneyAddress, {
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      } as never);

      expect(setPaymentOverrideMock).toHaveBeenCalledWith('tx-1', {
        paymentOverride: PaymentOverride.MoneyAccount,
        refundTo: moneyAddress,
      });
    });

    it('sets MoneyAccount override without refundTo for withdraw flows', () => {
      applyMoneyAccountOverride('tx-2', moneyAddress, {
        id: 'tx-2',
        type: TransactionType.perpsWithdraw,
      } as never);

      expect(setPaymentOverrideMock).toHaveBeenCalledWith('tx-2', {
        paymentOverride: PaymentOverride.MoneyAccount,
      });
    });
  });

  describe('clearPaymentOverride', () => {
    it('clears the payment override', () => {
      clearPaymentOverride('tx-3');

      expect(setPaymentOverrideMock).toHaveBeenCalledWith('tx-3', {
        paymentOverride: undefined,
      });
    });
  });
});
