import React from 'react';
import { CreateEthAccount } from '.';

export default {
  title: 'Components/Multichain/CreateAccount',
  component: CreateEthAccount,
};

export const DefaultStory = (args) => <CreateEthAccount {...args} />;
DefaultStory.storyName = 'Default';
