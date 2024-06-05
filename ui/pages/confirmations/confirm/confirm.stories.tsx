import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';
import { unapprovedPersonalSignMsg, signatureRequestSIWE } from '../../../../test/data/confirmations/personal_sign';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import ConfirmPage from './confirm';

const mockMetamaskState = { ...mockState.metamask };

const argsSignature = {
  data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
  from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  origin: 'https://metamask.github.io',
}
const argTypesSignature = {
  data: {
    control: 'text',
    description: '(non-param) overrides msgParams.data',
  },
  from: {
    control: 'text',
    description: '(non-param) overrides msgParams.from',
  },
  origin: {
    control: 'text',
    description: '(non-param) overrides msgParams.origin',
  },
}

const ConfirmPageStory = {
  title: 'Pages/Confirm/ConfirmPage',
  decorators: [(story) => <div style={{ height: '600px' }}>{story()}</div>],
}

export const PersonalSignStory = (args) => {
  const { data, from, origin } = args;
  const mockConfirmation = cloneDeep(unapprovedPersonalSignMsg);

  mockConfirmation.msgParams.data = data;
  mockConfirmation.msgParams.from = from;
  mockConfirmation.msgParams.origin = origin;

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: mockMetamaskState,
  });

  return <Provider store={store}><ConfirmPage /></Provider>;
};

PersonalSignStory.storyName = 'Personal Sign';
PersonalSignStory.args = argsSignature;
PersonalSignStory.argTypes = argTypesSignature;

export const SignInWithEthereumSIWEStory = (args) => {
  const { data, from, origin } = args;
  const mockConfirmation = cloneDeep(signatureRequestSIWE);

  mockConfirmation.msgParams.data = data;
  mockConfirmation.msgParams.from = from;
  mockConfirmation.msgParams.origin = origin;

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: mockMetamaskState,
  });

  return <Provider store={store}><ConfirmPage /></Provider>;
};

SignInWithEthereumSIWEStory.storyName = 'Sign-in With Ethereum (SIWE)';
SignInWithEthereumSIWEStory.args = {
  ...argsSignature,
  data: signatureRequestSIWE.msgParams.data,
};
SignInWithEthereumSIWEStory.argTypes = argTypesSignature;

export default ConfirmPageStory;
