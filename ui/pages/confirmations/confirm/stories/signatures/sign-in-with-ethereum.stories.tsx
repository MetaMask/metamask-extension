import ConfirmPage from '../../confirm'
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate
} from './utils';
import { signatureRequestSIWE } from '../../../../../../test/data/confirmations/personal_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature
 * that parses as a valid Sign-in-With-Ethereum (SIWE)(EIP-4361) signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/SignInWithEthereum',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
  args: {
    msgParams: { ...signatureRequestSIWE.msgParams },
  },
};

export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, signatureRequestSIWE);
}
DefaultStory.storyName = 'Default';