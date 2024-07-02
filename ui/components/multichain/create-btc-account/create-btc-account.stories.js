import React from 'react';
import { CreateBtcAccount } from '.';

export default {
  title: 'Components/Multichain/CreateBtcAccount',
  component: CreateBtcAccount,
};

export const DefaultStory = (args) => <CreateBtcAccount {...args} />;
DefaultStory.storyName = 'Default';
