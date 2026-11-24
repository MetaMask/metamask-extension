import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import ConfirmPage from '../../confirm';
import { CONFIRM_PAGE_DECORATOR, ConfirmStoryTemplate } from '../utils';
import {
  DEPOSIT_METHOD_DATA,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../test/data/confirmations/contract-interaction';

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

export default {
  title: 'Pages/Confirmations/Confirm/Transactions/ContractInteraction',
  component: ConfirmPage,
  decorators: CONFIRM_PAGE_DECORATOR,
};

export const DefaultStory = () => {
  const confirmation = genUnapprovedContractInteractionConfirmation({
    address: FROM,
    txData: DEPOSIT_METHOD_DATA,
    chainId: '0x5',
  });

  return ConfirmStoryTemplate(getMockConfirmStateForTransaction(confirmation));
};

DefaultStory.storyName = 'Default';
