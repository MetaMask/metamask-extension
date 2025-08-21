import { getMockTypedSignConfirmStateForRequest } from '../../../../../../test/data/confirmations/helper';
import ConfirmPage from '../../confirm';
import {
  ARG_TYPES_SIGNATURE,
  CONFIRM_PAGE_DECORATOR,
  ConfirmStoryTemplate,
} from '../utils';
import { unapprovedTypedSignMsgV1 } from '../../../../../../test/data/confirmations/typed_sign';

/**
 * The `<ConfirmPage>` that's displayed when the current confirmation is a version "V1" `eth_signTypedData` signature.
 */
export default {
  title: 'Pages/Confirmations/Confirm/Stories/Signatures/ConfirmPage',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
  argTypes: ARG_TYPES_SIGNATURE,
};

export const DefaultStory = (args) => {
  return ConfirmStoryTemplate(
    getMockTypedSignConfirmStateForRequest(unapprovedTypedSignMsgV1),
  );
};

DefaultStory.storyName = 'Default';
