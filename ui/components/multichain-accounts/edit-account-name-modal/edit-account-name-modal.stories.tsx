import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { EditAccountNameModal } from './edit-account-name-modal';

const mockStore = configureStore([]);

export default {
  title: 'Components/MultichainAccounts/EditAccountNameModal',
  component: EditAccountNameModal,
  parameters: {
    docs: {
      description: {
        component:
          'A modal component for editing account names with form validation and Redux integration.',
      },
    },
  },
  decorators: [
    (Story) => {
      const store = mockStore({
        metamask: {
          localeMessages: {
            current: {
              editAccountName: 'Edit Account Name',
              name: 'Name',
              save: 'Save',
            },
            currentLocale: 'en',
          },
        },
      });

      return (
        <Provider store={store}>
          <div style={{ height: '600px', position: 'relative' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
} as Meta<typeof EditAccountNameModal>;

export const Default: StoryFn<typeof EditAccountNameModal> = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>Account Name: Account 1</h3>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#037DD6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Edit Account Name
        </button>
      </div>

      <EditAccountNameModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentAccountName="Account 1"
        address="0x1234567890abcdef1234567890abcdef12345678"
      />
    </div>
  );
};
