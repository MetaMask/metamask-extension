import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../test/data/confirmations/contract-interaction';
import {
  PERSONAL_SIGN_SENDER_ADDRESS,
  unapprovedPersonalSignMsg,
} from '../../../../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../../types/confirm';
import { getConfirmationSender } from './utils';

describe('confirm - utils', () => {
  describe('getConfirmationSender()', () => {
    it("returns the sender address from a signature if it's passed", () => {
      const testCurrentConfirmation =
        genUnapprovedContractInteractionConfirmation() as TransactionMeta;
      const { from } = getConfirmationSender(testCurrentConfirmation);

      expect(from).toEqual(CONTRACT_INTERACTION_SENDER_ADDRESS);
    });

    it("returns the sender address from a transaction if it's passed", () => {
      const { from } = getConfirmationSender(
        unapprovedPersonalSignMsg as SignatureRequestType,
      );

      expect(from).toEqual(PERSONAL_SIGN_SENDER_ADDRESS);
    });

    it('returns no sender address if no confirmation is passed', () => {
      const testCurrentConfirmation = undefined;
      const { from } = getConfirmationSender(testCurrentConfirmation);

      expect(from).toEqual(undefined);
    });
  });
});
