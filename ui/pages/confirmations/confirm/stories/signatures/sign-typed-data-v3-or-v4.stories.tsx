import ConfirmPage from '../../confirm'
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  SignatureStoryTemplate
} from './utils';
import { permitSignatureMsg, unapprovedTypedSignMsgV3, unapprovedTypedSignMsgV4 } from '../../../../../../test/data/confirmations/typed_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is either a version
 * "V3" or "V4" `eth_signTypedData` signature. The default example is version "V4".
 */
export default {
  title: 'Pages/Confirmations/Confirm/Signatures/SignedTypedDataV3orV4',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
};

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is either a
 * "V3" or "V4" `eth_signTypedData` signature that parses as a valid permit signature.
 */
export const PermitStory = (args) => {
  return SignatureStoryTemplate(args, permitSignatureMsg);
};
PermitStory.storyName = 'Permit';
PermitStory.args = {
  msgParams: { ...permitSignatureMsg.msgParams },
};

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a "V3" `eth_signTypedData` signature.
 */
export const V3Story = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV4);
}
V3Story.storyName = 'V3';
V3Story.args = {
  msgParams: { ...unapprovedTypedSignMsgV3.msgParams },
};

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a "V4" `eth_signTypedData` signature.
 */
export const DefaultStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV4);
}
DefaultStory.storyName = 'V4';
DefaultStory.args = {
  msgParams: { ...unapprovedTypedSignMsgV4.msgParams },
};
