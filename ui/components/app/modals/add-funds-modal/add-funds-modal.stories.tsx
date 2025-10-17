import React from 'react';
import AddFundsModal from '.';

export default {
  title: 'Components/App/Modals/AddFundsModal',
};

export const DefaultStory = () => (
  <AddFundsModal
    onClose={() => {}}
    token={{
      address: '0x0',
      decimals: 18,
      symbol: 'USDC',
      conversionRate: {
        usd: '1',
      },
    }}
    chainId="0x1"
    payerAddress="0x0"
  />
);

DefaultStory.storyName = 'Default';
