import React from 'react';
import NonEvmOverview from './non-evm-overview';

export default {
  title: 'Components/App/WalletOverview/BtcOverview',
  component: NonEvmOverview,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays an overview of Bitcoin wallet information.',
      },
    },
  },
};

const Template = (args) => <NonEvmOverview {...args} />;

export const Default = Template.bind({});
