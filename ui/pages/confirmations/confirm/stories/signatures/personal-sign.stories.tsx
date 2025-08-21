import {
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import ConfirmPage from '../../confirm';
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  ConfirmStoryTemplate,
} from '../utils';
import { signatureRequestSIWE } from '../../../../../../test/data/confirmations/personal_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Stories/Signatures/PersonalSign',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
};

export const DefaultStory = () => {
  return ConfirmStoryTemplate(getMockPersonalSignConfirmState());
};
DefaultStory.storyName = 'Default';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature
 * that parses as a valid Sign-in-With-Ethereum (SIWE)(EIP-4361) signature.
 */
export const SignInWithEthereumStory = () => {
  return ConfirmStoryTemplate(
    getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE),
  );
};
SignInWithEthereumStory.storyName = 'Sign-in With Ethereum (SIWE)';
