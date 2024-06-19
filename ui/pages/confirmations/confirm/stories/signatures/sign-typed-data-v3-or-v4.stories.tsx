import ConfirmPage from '../../confirm'
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate
} from './utils';
import { unapprovedTypedSignMsgV4 } from '../../../../../../test/data/confirmations/typed_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is either a version "V3" or "V4" `eth_signTypedData` signature.
 * The default example is version "V4".
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/SignedTypedDataV3orV4',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
  args: {
    msgParams: { ...unapprovedTypedSignMsgV4.msgParams },
  },
};

export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV4);
}
DefaultStory.storyName = 'Default';