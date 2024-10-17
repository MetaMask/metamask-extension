import { StoryFn } from '@storybook/react';
import React from 'react';
import IncomingTransactionToggle from './incoming-transaction-toggle';
import { ALL_NETWORKS_DATA, INCOMING_DATA } from './mock-data';
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';

const IncomingTransactionToggleStory = {
  title: 'Components/App/IncomingTransactionToggle',
  component: IncomingTransactionToggle,
  argTypes: {},
};

export const DefaultStory: StoryFn<typeof IncomingTransactionToggle> = () => {
  return (
    <IncomingTransactionToggle
      setIncomingTransactionsPreferences={(chainId, value) => {
        console.log(chainId, value);
      }}
      networkConfigurations={
        ALL_NETWORKS_DATA as unknown as Record<Hex, NetworkConfiguration>
      }
      incomingTransactionsPreferences={INCOMING_DATA}
    />
  );
};

DefaultStory.storyName = 'Default';

export default IncomingTransactionToggleStory;
