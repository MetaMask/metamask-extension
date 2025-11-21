import React from 'react';
import { DisconnectPermissionsModal } from './disconnect-permissions-modal';

export default {
  title: 'Components/Multichain/DisconnectPermissionsModal',
  component: DisconnectPermissionsModal,
  parameters: {
    docs: {
      description: {
        component:
          'A modal that shows disconnect permissions on a site with options to skip or remove all permissions.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    onClose: {
      action: 'closed',
      description: 'Called when the modal is closed',
    },
    onSkip: {
      action: 'skipped',
      description: 'Called when the skip button is clicked',
    },
    onRemoveAll: {
      action: 'removeAll',
      description: 'Called when the remove all button is clicked',
    },
  },
};

const Template = (args) => <DisconnectPermissionsModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  permissions: [
    {
      permission: {
        permissionResponse: {
          permission: {
            type: 'native-token-stream',
            data: {
              amountPerSecond: '0xde0b6b3a7640000', // 1 ETH in hex
            },
          },
          chainId: '0x1',
          address: '0x1234567890123456789012345678901234567890',
          context: 'test-context',
          signerMeta: {
            delegationManager: '0x1234567890123456789012345678901234567890',
          },
        },
        siteOrigin: 'example.com',
      },
      chainId: '0x1',
      permissionType: 'native-token-stream',
    },
    {
      permission: {
        permissionResponse: {
          permission: {
            type: 'erc20-token-periodic',
            data: {
              periodAmount: '0xde0b6b3a7640000', // 1 ETH in hex
              periodDuration: '2592000', // 30 days in seconds
            },
          },
          chainId: '0x89',
          address: '0x1234567890123456789012345678901234567890',
          context: 'test-context',
          signerMeta: {
            delegationManager: '0x1234567890123456789012345678901234567890',
          },
        },
        siteOrigin: 'example.com',
      },
      chainId: '0x89',
      permissionType: 'erc20-token-periodic',
    },
  ],
};

export const Closed = Template.bind({});
Closed.args = {
  isOpen: false,
};
