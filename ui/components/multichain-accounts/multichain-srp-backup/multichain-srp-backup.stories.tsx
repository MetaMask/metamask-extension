import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MultichainSrpBackup } from './multichain-srp-backup';

const meta: Meta<typeof MultichainSrpBackup> = {
  title: 'Components/MultichainAccounts/MultichainSrpBackup',
  component: MultichainSrpBackup,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a Secret Recovery Phrase backup button.',
      },
    },
  },
  decorators: [
    (Story) => {
      const store = configureStore({
        metamask: {
          ...mockState.metamask,
        },
      });

      return (
        <Provider store={store}>
          <MemoryRouter>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Story />
            </div>
          </MemoryRouter>
        </Provider>
      );
    },
  ],
  argTypes: {
    shouldShowBackupReminder: {
      control: 'boolean',
      description: 'When true, displays a backup reminder with error styling',
      defaultValue: false,
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    keyringId: {
      control: 'text',
      description: 'ID of the keyring for SRP quiz modal',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultichainSrpBackup>;

export const Default: Story = {
  args: {
    shouldShowBackupReminder: false,
    keyringId: 'test-keyring-id',
  },
};

export const WithBackupReminder: Story = {
  args: {
    shouldShowBackupReminder: true,
    keyringId: 'test-keyring-id',
  },
};
