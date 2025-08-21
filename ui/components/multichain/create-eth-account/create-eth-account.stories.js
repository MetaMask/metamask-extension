import React from 'react';
import { CreateEthAccount } from '.';

export default {
  title: 'Components/Multichain/CreateETHAccount',
  component: CreateEthAccount,
};

export const DefaultStory = (args) => <CreateEthAccount {...args} />;
DefaultStory.storyName = 'Default';
