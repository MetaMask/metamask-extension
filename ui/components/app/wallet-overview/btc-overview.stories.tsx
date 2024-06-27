import React from 'react';
import BtcOverview from './btc-overview';

export default {
  title: 'Components/App/WalletOverview/BtcOverview',
  component: BtcOverview,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays an overview of Bitcoin wallet information.',
      },
    },
  },
};

const Template = (args) => <BtcOverview {...args} />;

export const Default = Template.bind({});
