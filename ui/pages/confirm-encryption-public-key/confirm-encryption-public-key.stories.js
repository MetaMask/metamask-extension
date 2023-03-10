import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../store/store';
import testData from '../../../.storybook/test-data';
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component';

const store = configureStore(testData);
const { confirmTransaction, history, metamask } = store.getState();

export default {
  title: 'Pages/ConfirmEncryptionPublicKey',

  component: ConfirmEncryptionPublicKey,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    fromAccount: {
      control: {
        type: 'object',
      },
    },
    clearConfirmTransaction: {
      action: 'clearConfirmTransaction',
    },
    cancelEncryptionPublicKey: {
      action: 'cancelEncryptionPublicKey',
    },
    encryptionPublicKey: {
      action: 'encryptionPublicKey',
    },
    conversionRate: {
      control: {
        type: 'number',
      },
    },
    history: {
      control: {
        type: 'object',
      },
    },
    requesterAddress: {
      control: {
        type: 'text',
      },
    },
    txData: {
      control: {
        type: 'object',
      },
    },
    subjectMetadata: {
      control: {
        type: 'object',
      },
    },
    mostRecentOverviewPage: {
      control: {
        type: 'text',
      },
    },
    nativeCurrency: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    fromAccount: metamask.accountArray[0],
    history: {
      push: action('history.push()'),
    },
    requesterAddress: confirmTransaction.txData.txParams.from,
    txData: confirmTransaction.txData,
    subjectMetadata: metamask.subjectMetadata,
    mostRecentOverviewPage: history.mostRecentOverviewPage,
    nativeCurrency: metamask.nativeCurrency,
    currentCurrency: metamask.currentCurrency,
    conversionRate: metamask.conversionRate,
  },
};

export const DefaultStory = (args) => {
  return <ConfirmEncryptionPublicKey {...args} />;
};

DefaultStory.storyName = 'Default';
