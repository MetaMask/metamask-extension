import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../test/data/confirmations/contract-interaction';
import {
  PERSONAL_SIGN_SENDER_ADDRESS,
  unapprovedPersonalSignMsg,
} from '../../../../../test/data/confirmations/personal_sign';
import {
  permitSignatureMsg,
  permitSignatureMsgWithUnsignedFields,
} from '../../../../../test/data/confirmations/typed_sign';
import { SignatureRequestType } from '../../types/confirm';
import { DAI_CONTRACT_ADDRESS } from './info/shared/constants';
import { getConfirmationSender, getIsRevokeDAIPermit } from './utils';

describe('confirm - utils', () => {
  describe('getIsRevokeDAIPermit()', () => {
    const getDAIPermit = (
      includeAllowedInSchema: boolean,
      includeVerifyingContractInSchema = true,
    ): SignatureRequestType => {
      const data = JSON.parse(permitSignatureMsg.msgParams?.data as string);
      data.domain.verifyingContract = DAI_CONTRACT_ADDRESS;
      data.message.allowed = false;

      if (includeAllowedInSchema) {
        data.types.Permit.push({ name: 'allowed', type: 'bool' });
      }
      if (!includeVerifyingContractInSchema) {
        data.types.EIP712Domain = data.types.EIP712Domain.filter(
          ({ name }: { name: string }) => name !== 'verifyingContract',
        );
      }

      return {
        ...permitSignatureMsg,
        msgParams: {
          ...permitSignatureMsg.msgParams,
          data: JSON.stringify(data),
        },
      } as SignatureRequestType;
    };

    it('detects a schema-declared DAI revocation', () => {
      expect(getIsRevokeDAIPermit(getDAIPermit(true))).toBe(true);
    });

    it('ignores an unsigned allowed field for DAI', () => {
      expect(getIsRevokeDAIPermit(getDAIPermit(false))).toBe(false);
    });

    it('ignores an unsigned DAI verifying contract', () => {
      expect(getIsRevokeDAIPermit(getDAIPermit(true, false))).toBe(false);
    });

    it('ignores allowed false for non-DAI permits', () => {
      expect(
        getIsRevokeDAIPermit(permitSignatureMsgWithUnsignedFields),
      ).toBe(false);
    });
  });

  describe('getConfirmationSender()', () => {
    test("returns the sender address from a signature if it's passed", () => {
      const testCurrentConfirmation =
        genUnapprovedContractInteractionConfirmation() as TransactionMeta;
      const { from } = getConfirmationSender(testCurrentConfirmation);

      expect(from).toEqual(CONTRACT_INTERACTION_SENDER_ADDRESS);
    });

    test("returns the sender address from a transaction if it's passed", () => {
      const { from } = getConfirmationSender(
        unapprovedPersonalSignMsg as SignatureRequestType,
      );

      expect(from).toEqual(PERSONAL_SIGN_SENDER_ADDRESS);
    });

    test('returns no sender address if no confirmation is passed', () => {
      const testCurrentConfirmation = undefined;
      const { from } = getConfirmationSender(testCurrentConfirmation);

      expect(from).toEqual(undefined);
    });
  });
});
