import {
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import ConfirmPage from '../../confirm';
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  ConfirmStoryTemplate,
} from '../utils';
import {
  permitSignatureMsg,
  unapprovedTypedSignMsgV3,
  unapprovedTypedSignMsgV4,
} from '../../../../../../test/data/confirmations/typed_sign';

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
export const PermitStory = () => {
  return ConfirmStoryTemplate(
    getMockTypedSignConfirmStateForRequest(permitSignatureMsg),
  );
};
PermitStory.storyName = 'Permit';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a "V3" `eth_signTypedData` signature.
 */
export const V3Story = () => {
  return ConfirmStoryTemplate(
    getMockTypedSignConfirmStateForRequest(unapprovedTypedSignMsgV3),
  );
};
V3Story.storyName = 'V3';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a "V4" `eth_signTypedData` signature.
 */
export const DefaultStory = () => {
  return ConfirmStoryTemplate(getMockTypedSignConfirmState());
};
DefaultStory.storyName = 'V4';
