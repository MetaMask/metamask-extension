import ConfirmPage from '../../confirm'
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate
} from './utils';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a `personal_sign` signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/PersonalSign',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
  args: {
    msgParams: { ...unapprovedPersonalSignMsg.msgParams },
  },
};

export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedPersonalSignMsg);
}
DefaultStory.storyName = 'Default';