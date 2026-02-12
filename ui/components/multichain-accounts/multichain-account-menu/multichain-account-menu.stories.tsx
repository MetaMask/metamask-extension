import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { MultichainAccountMenu } from './multichain-account-menu';

const meta: Meta<typeof MultichainAccountMenu> = {
  title: 'Components/MultichainAccounts/MultichainAccountMenu',
  component: MultichainAccountMenu,
  parameters: {
    backgrounds: {
      default: 'light',
    },
    docs: {
      description: {
        component:
          'A menu component for multichain accounts that displays a popover when clicked.',
      },
    },
  },
  argTypes: {
    isRemovable: {
      control: 'boolean',
      description:
        'Whether the account is removable. When true, a remove option appears in the menu.',
    },
    accountGroupId: {
      control: 'text',
      description: 'ID of an account group',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{ padding: '50px', display: 'flex', justifyContent: 'center' }}
      >
        <div
          style={{
            width: '300px',
            border: '1px solid #ccc',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: '16px' }}>
            Account Options
          </h4>
          <Story />
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            Click the icon to toggle menu options
          </p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultichainAccountMenu>;

export const Default: Story = {
  args: {
    accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
    isRemovable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state of MultichainAccountMenu with non-removable account. The menu will not include a remove option.',
      },
    },
  },
};

export const RemovableAccount: Story = {
  args: {
    accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
    isRemovable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'MultichainAccountMenu with a removable account. The menu includes a remove option highlighted in error color.',
      },
    },
  },
};
