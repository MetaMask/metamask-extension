import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import ConfirmPage from '../../confirm';
import { CONFIRM_PAGE_DECORATOR, ConfirmStoryTemplate } from '../utils';
import {
  DEPOSIT_METHOD_DATA,
  PAYMASTER_AND_DATA,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../test/data/mock-state.json';

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

export default {
  title: 'Pages/Confirmations/Confirm/Stories/Transactions/ContractInteraction',
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

export const UserOperationStory = () => {
  const confirmation = {
    ...genUnapprovedContractInteractionConfirmation({
      address: FROM,
      txData: DEPOSIT_METHOD_DATA,
      chainId: '0x5',
    }),
    isUserOperation: true,
  };

  const confirmState = getMockConfirmStateForTransaction(confirmation, {
    metamask: {
      preferences: {
        ...mockState.metamask.preferences,
        petnamesEnabled: true,
      },
      userOperations: {
        [confirmation.id]: {
          userOperation: {
            paymasterAndData: PAYMASTER_AND_DATA,
          },
        },
      },
    },
  });

  return ConfirmStoryTemplate(confirmState);
};

UserOperationStory.storyName = 'User Operation';
