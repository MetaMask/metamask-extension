import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';
import {
  unapprovedPersonalSignMsg,
  signatureRequestSIWE,
} from '../../../../test/data/confirmations/personal_sign';
import {
  unapprovedTypedSignMsgV1,
  unapprovedTypedSignMsgV4,
  permitSignatureMsg,
} from '../../../../test/data/confirmations/typed_sign';
import {
  DEPOSIT_METHOD_DATA,
  PAYMASTER_AND_DATA,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import ConfirmPage from './confirm';

/**
 * @note When we extend this storybook page to support more confirmation types,
 * consider creating a new storybook pages.
 */
const ConfirmPageStory = {
  title: 'Pages/Confirm/ConfirmPage',
  decorators: [(story) => <div style={{ height: '600px' }}>{story()}</div>],
};

const ARGS_SIGNATURE = {
  msgParams: { ...unapprovedPersonalSignMsg.msgParams },
};

const ARG_TYPES_SIGNATURE = {
  msgParams: {
    control: 'object',
    description: '(non-param) overrides currentConfirmation.msgParams',
  },
};

function SignatureStoryTemplate(args, confirmation) {
  const mockConfirmation = cloneDeep(confirmation);
  mockConfirmation.msgParams = args.msgParams;

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: { ...mockState.metamask },
  });

  return (
    <Provider store={store}>
      <ConfirmPage />
    </Provider>
  );
}

function TransactionStoryTemplate(confirmation, additionalState = {}) {
  const mockConfirmation = cloneDeep(confirmation);

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: { ...mockState.metamask, ...additionalState },
  });

  return (
    <Provider store={store}>
      <ConfirmPage />
    </Provider>
  );
}

export const PersonalSignStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedPersonalSignMsg);
};

PersonalSignStory.storyName = 'Personal Sign';
PersonalSignStory.argTypes = ARG_TYPES_SIGNATURE;
PersonalSignStory.args = ARGS_SIGNATURE;

export const SignInWithEthereumSIWEStory = (args) => {
  return SignatureStoryTemplate(args, signatureRequestSIWE);
};

SignInWithEthereumSIWEStory.storyName = 'Sign-in With Ethereum (SIWE)';
SignInWithEthereumSIWEStory.argTypes = ARG_TYPES_SIGNATURE;
SignInWithEthereumSIWEStory.args = {
  ...ARGS_SIGNATURE,
  msgParams: signatureRequestSIWE.msgParams,
};

export const SignTypedDataStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV1);
};

SignTypedDataStory.storyName = 'SignTypedData';
SignTypedDataStory.argTypes = ARG_TYPES_SIGNATURE;
SignTypedDataStory.args = {
  ...ARGS_SIGNATURE,
  msgParams: unapprovedTypedSignMsgV1.msgParams,
};

export const PermitStory = (args) => {
  return SignatureStoryTemplate(args, permitSignatureMsg);
};

PermitStory.storyName = 'SignTypedData Permit';
PermitStory.argTypes = ARG_TYPES_SIGNATURE;
PermitStory.args = {
  ...ARGS_SIGNATURE,
  msgParams: permitSignatureMsg.msgParams,
};

export const SignTypedDataV4Story = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV4);
};

SignTypedDataV4Story.storyName = 'SignTypedData V4';
SignTypedDataV4Story.argTypes = ARG_TYPES_SIGNATURE;
SignTypedDataV4Story.args = {
  ...ARGS_SIGNATURE,
  msgParams: unapprovedTypedSignMsgV4.msgParams,
};

export const ContractInteractionStory = () => {
  const confirmation = genUnapprovedContractInteractionConfirmation({
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    txData: DEPOSIT_METHOD_DATA,
  });

  return TransactionStoryTemplate(confirmation);
};

ContractInteractionStory.storyName = 'Contract Interaction';

export const UserOperationStory = () => {
  const confirmation = {
    ...genUnapprovedContractInteractionConfirmation({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      txData: DEPOSIT_METHOD_DATA,
    }),
    isUserOperation: true,
  };

  return TransactionStoryTemplate(confirmation, {
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
  });
};

UserOperationStory.storyName = 'User Operation';

export default ConfirmPageStory;
