import React from 'react';
import ContractDetailsModal from './contract-details-modal';

export default {
  title: 'Confirmations/Components/Modals/ContractDetailsModal',

  argTypes: {
    onClose: {
      action: 'onClose',
    },
    tokenName: {
      control: {
        type: 'text',
      },
    },
    tokenAddress: {
      control: {
        type: 'text',
      },
    },
    toAddress: {
      control: {
        type: 'text',
      },
    },
    chainId: {
      control: {
        type: 'text',
      },
    },
    rpcPrefs: {
      control: {
        type: 'object',
      },
    },
  },
  args: {
    tokenName: 'DAI',
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
    chainId: '0x3',
    rpcPrefs: {},
  },
};

export const DefaultStory = (args) => {
  return <ContractDetailsModal {...args} />;
};

DefaultStory.storyName = 'Default';
