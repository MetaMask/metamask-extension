import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import KeyringSnapRemovalWarning from './keyring-snap-removal-warning';

const store = configureStore(mockState);

const mockSnap = {
  id: 'mock-snap-id',
  manifest: {
    proposedName: 'ABC Snap',
  },
};

export default {
  title: 'Components/App/Snaps/KeyringSnapRemovalWarning',
  component: KeyringSnapRemovalWarning,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    onCancel: {
      action: 'onCancel',
    },
    onClose: {
      action: 'onClose',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    onBack: {
      action: 'onBack',
    },
    isOpen: {
      control: 'boolean',
    },
    keyringAccounts: {
      control: 'object',
    },
  },
  args: {
    snap: mockSnap,
    isOpen: true,
    keyringAccounts: [
      {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        name: 'Test Account 2',
      },
    ],
  },
};

export const DefaultStory = (args) => <KeyringSnapRemovalWarning {...args} />;

DefaultStory.storyName = 'Default';
