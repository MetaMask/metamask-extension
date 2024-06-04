import React from 'react';
import { CreateBtcAccount } from '.';

export default {
  title: 'Components/Multichain/CreateAccount',
  component: CreateBtcAccount,
};

export const DefaultStory = (args) => <CreateBtcAccount {...args} />;
DefaultStory.storyName = 'Default';
