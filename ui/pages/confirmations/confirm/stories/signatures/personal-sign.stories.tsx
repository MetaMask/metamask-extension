import ConfirmPage from '../../confirm'
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate
} from '../utils';
import { signatureRequestSIWE, unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/PersonalSign',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
};

export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedPersonalSignMsg);
}
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  msgParams: { ...unapprovedPersonalSignMsg.msgParams },
};

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature
 * that parses as a valid Sign-in-With-Ethereum (SIWE)(EIP-4361) signature.
 */
export const SignInWithEthereumStory = (args) => {
  return SignatureStoryTemplate(args, signatureRequestSIWE);
}
SignInWithEthereumStory.storyName = 'Sign-in With Ethereum (SIWE)';
SignInWithEthereumStory.args = {
  msgParams: { ...signatureRequestSIWE.msgParams },
};