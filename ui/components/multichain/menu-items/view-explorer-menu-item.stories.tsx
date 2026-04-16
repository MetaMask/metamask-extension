import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ViewExplorerMenuItem } from './view-explorer-menu-item';

const meta: Meta<typeof ViewExplorerMenuItem> = {
  title: 'Components/Multichain/MenuItems/ViewExplorerMenuItem',
  component: ViewExplorerMenuItem,
  decorators: [
    (Story) => (
      <div style={{ width: '280px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ViewExplorerMenuItem>;

export const Default: Story = {
  args: {
    metricsLocation: 'Global Menu',
    closeMenu: () => console.log('Menu closed'),
    account: {
      id: '5c46d55d-df2f-4b89-a6e9-e1c7b64c6c42',
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      type: 'eip155:eoa',
      options: {},
      methods: [
        'personal_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      metadata: {
        name: 'Account 1',
        keyring: {
          type: 'HD Key Tree',
        },
      },
    },
  },
};
