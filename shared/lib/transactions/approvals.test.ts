import { BigNumber } from 'bignumber.js';
import {
  buildApproveTransactionData,
  buildIncreaseAllowanceTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../../test/data/confirmations/token-approve';
import { updateApprovalAmount } from './approvals';

const SPENDER_MOCK = '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb';
const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const AMOUNT_MOCK = 123;
const EXPIRATION_MOCK = 456;

describe('Approvals Utils', () => {
  describe('updateApprovalAmount', () => {
    it('updates legacy approval amount', () => {
      expect(
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          1.23,
          5,
        ),
      ).toStrictEqual(buildApproveTransactionData(SPENDER_MOCK, 123000));
    });

    it('updates increaseAllowance amount', () => {
      expect(
        updateApprovalAmount(
          buildIncreaseAllowanceTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          1.23,
          5,
        ),
      ).toStrictEqual(
        buildIncreaseAllowanceTransactionData(SPENDER_MOCK, 123000),
      );
    });

    it('updates Permit2 approval amount', () => {
      expect(
        updateApprovalAmount(
          buildPermit2ApproveTransactionData(
            SPENDER_MOCK,
            TOKEN_ADDRESS_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
          1.23,
          5,
        ),
      ).toStrictEqual(
        buildPermit2ApproveTransactionData(
          SPENDER_MOCK,
          TOKEN_ADDRESS_MOCK,
          123000,
          EXPIRATION_MOCK,
        ),
      );
    });

    it('handles string amounts with # prefix', () => {
      expect(
        updateApprovalAmount(
          buildPermit2ApproveTransactionData(
            SPENDER_MOCK,
            TOKEN_ADDRESS_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
          '#1.5',
          2,
        ),
      ).toStrictEqual(
        buildPermit2ApproveTransactionData(
          SPENDER_MOCK,
          TOKEN_ADDRESS_MOCK,
          150,
          EXPIRATION_MOCK,
        ),
      );
    });

    it('handles string amounts with multiple # characters', () => {
      expect(
        updateApprovalAmount(
          buildPermit2ApproveTransactionData(
            SPENDER_MOCK,
            TOKEN_ADDRESS_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
          '##2.5##',
          1,
        ),
      ).toStrictEqual(
        buildPermit2ApproveTransactionData(
          SPENDER_MOCK,
          TOKEN_ADDRESS_MOCK,
          25,
          EXPIRATION_MOCK,
        ),
      );
    });

    it('handles BigNumber amounts', () => {
      expect(
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          new BigNumber(5.5),
          1,
        ),
      ).toStrictEqual(buildApproveTransactionData(SPENDER_MOCK, 55));
    });

    it('throws error for invalid amount string', () => {
      expect(() =>
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          'invalid',
          2,
        ),
      ).toThrow('Invalid amount value: invalid');
    });

    it('throws error for empty string amount', () => {
      expect(() =>
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          '',
          2,
        ),
      ).toThrow('Invalid amount value:');
    });

    it('throws error for negative amount', () => {
      expect(() =>
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          -5,
          2,
        ),
      ).toThrow('Amount cannot be negative');
    });

    it('throws error for amount that results in non-integer value', () => {
      expect(() =>
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          1.234,
          2,
        ),
      ).toThrow(
        'Amount results in non-integer value after applying 2 decimals',
      );
    });

    it('throws error for Permit2 amount exceeding uint160 max', () => {
      // Max uint160 is 2^160 - 1 = 1461501637330902918203684832716283019655932542975
      const maxUint160 = new BigNumber(2).pow(160).minus(1);
      const overMaxValue = maxUint160.plus(1).div(new BigNumber(10).pow(18));

      expect(() =>
        updateApprovalAmount(
          buildPermit2ApproveTransactionData(
            SPENDER_MOCK,
            TOKEN_ADDRESS_MOCK,
            AMOUNT_MOCK,
            EXPIRATION_MOCK,
          ),
          overMaxValue.toString(),
          18,
        ),
      ).toThrow('Amount exceeds maximum value for uint160');
    });

    it('handles zero amount', () => {
      expect(
        updateApprovalAmount(
          buildApproveTransactionData(SPENDER_MOCK, AMOUNT_MOCK),
          0,
          18,
        ),
      ).toStrictEqual(buildApproveTransactionData(SPENDER_MOCK, 0));
    });

    it('handles very large amounts within uint160 bounds for Permit2', () => {
      // Use a large but valid value: max uint160 divided by 10^18 (typical token decimals)
      const maxUint160 = new BigNumber(2).pow(160).minus(1);
      const largeValue = maxUint160
        .div(new BigNumber(10).pow(18))
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

      const result = updateApprovalAmount(
        buildPermit2ApproveTransactionData(
          SPENDER_MOCK,
          TOKEN_ADDRESS_MOCK,
          AMOUNT_MOCK,
          EXPIRATION_MOCK,
        ),
        largeValue.toString(),
        18,
      );

      // Just verify it doesn't throw and returns valid data
      expect(result).toMatch(/^0x[0-9a-f]+$/u);
    });
  });
});
