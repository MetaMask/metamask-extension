import React from 'react';
import { SendPage } from '.';

export default {
  title: 'Components/Multichain/Send',
  component: SendPage,
  argTypes: {},
  args: {},
};

export const DefaultStory = (args) => <SendPage {...args} />;
DefaultStory.storyName = 'Default';
DefaultStory.args = {};
