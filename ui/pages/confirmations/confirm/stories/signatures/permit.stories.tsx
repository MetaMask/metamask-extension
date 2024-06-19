import ConfirmPage from '../../confirm';
import { permitSignatureMsg } from '../../../../../../test/data/confirmations/typed_sign';
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate,
} from './utils';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is either a
 * "V3" or "V4" `eth_signTypedData` signature that parses as a valid permit signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/Permit',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
  args: {
    msgParams: { ...permitSignatureMsg.msgParams },
  },
};

export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, permitSignatureMsg);
};
DefaultStory.storyName = 'Default';