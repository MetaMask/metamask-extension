import React from 'react';
import { AccountPicker } from '.';

const CHAOS_ACCOUNT = {
  address: '"0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e"',
  name: 'Account That Has A Really Really Really Really Really Long Name',
  balance: '0x152387ad22c3f0',
};

export default {
  title: 'Components/Multichain/AccountPicker',
  component: AccountPicker,
  argTypes: {
    account: {
      control: 'object',
    },
  },
  args: {
    account: {
      address: '"0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e"',
      name: 'Account 1',
      balance: '0x152387ad22c3f0',
    },
  },
};

export const DefaultStory = (args) => <AccountPicker {...args} />;
DefaultStory.storyName = 'Default';

export const ChaosStory = (args) => (
  <div
    style={{ maxWidth: '300px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountPicker {...args} account={CHAOS_ACCOUNT} />
  </div>
);
DefaultStory.storyName = 'Default';
