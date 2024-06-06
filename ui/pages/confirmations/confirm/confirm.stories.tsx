import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';
import { unapprovedPersonalSignMsg, signatureRequestSIWE } from '../../../../test/data/confirmations/personal_sign';
import { unapprovedTypedSignMsgV1, unapprovedTypedSignMsgV4, permitSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import ConfirmPage from './confirm';

const ConfirmPageStory = {
  title: 'Pages/Confirm/ConfirmPage',
  decorators: [(story) => <div style={{ height: '600px' }}>{story()}</div>],
}

const argsSignature = {
  msgParams: { ...unapprovedPersonalSignMsg.msgParams },
}

const argTypesSignature = {
  msgParams: {
    control: 'object',
    description: '(non-param) overrides currentConfirmation.msgParams',
  },
}

function SignatureStoryTemplate(args, confirmation) {
  const mockConfirmation = cloneDeep(confirmation);
  mockConfirmation.msgParams = args.msgParams;

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: { ...mockState.metamask },
  });

  return <Provider store={store}><ConfirmPage /></Provider>;
}

export const PersonalSignStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedPersonalSignMsg);
};

PersonalSignStory.storyName = 'Personal Sign';
PersonalSignStory.argTypes = argTypesSignature;
PersonalSignStory.args = argsSignature;

export const SignInWithEthereumSIWEStory = (args) => {
  return SignatureStoryTemplate(args, signatureRequestSIWE);
};

SignInWithEthereumSIWEStory.storyName = 'Sign-in With Ethereum (SIWE)';
SignInWithEthereumSIWEStory.argTypes = argTypesSignature;
SignInWithEthereumSIWEStory.args = {
  ...argsSignature,
  msgParams: signatureRequestSIWE.msgParams,
};

export const SignTypedDataStory = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV1);
};

SignTypedDataStory.storyName = 'SignTypedData';
SignTypedDataStory.argTypes = argTypesSignature;
SignTypedDataStory.args = {
  ...argsSignature,
  msgParams: unapprovedTypedSignMsgV1.msgParams,
};

export const PermitStory = (args) => {
  return SignatureStoryTemplate(args, permitSignatureMsg);
};

PermitStory.storyName = 'SignTypedData Permit';
PermitStory.argTypes = argTypesSignature;
PermitStory.args = {
  ...argsSignature,
  msgParams: permitSignatureMsg.msgParams,
};

export const SignTypedDataV4Story = (args) => {
  return SignatureStoryTemplate(args, unapprovedTypedSignMsgV4);
};

SignTypedDataV4Story.storyName = 'SignTypedData V4';
SignTypedDataV4Story.argTypes = argTypesSignature;
SignTypedDataV4Story.args = {
  ...argsSignature,
  msgParams: unapprovedTypedSignMsgV4.msgParams,
};

export default ConfirmPageStory;
