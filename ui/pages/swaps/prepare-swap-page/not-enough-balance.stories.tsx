import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import NotEnoughBalance from './not-enough-balance';

export default {
  title: 'Pages/Swaps/NotEnoughBalance',
  component: NotEnoughBalance,
} as Meta<typeof NotEnoughBalance>;

export const DefaultStory: StoryFn<typeof NotEnoughBalance> = () => {
  return (
    <NotEnoughBalance
      title="Insufficient balance"
      actionableBalanceErrorMessage="You need 0.0103 more ETH to complete this swap"
      needsMoreGas={true}
      openBuyCryptoInPdapp={() => {
        console.log('openBuyCryptoInPdapp');
      }}
      needsMoreGasText="Buy more ETH"
    />
  );
};

DefaultStory.storyName = 'Default';
