import React from 'react';
import { CreateAccount } from '.';

export default {
  title: 'Components/Multichain/CreateAccount',
  component: CreateAccount,
};

export const DefaultStory = (args) => <CreateAccount {...args} />;
DefaultStory.storyName = 'Default';
