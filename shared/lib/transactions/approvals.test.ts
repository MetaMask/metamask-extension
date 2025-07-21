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
  });
});
