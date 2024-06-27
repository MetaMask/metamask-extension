import React from 'react';
import {
  CreateNamedSnapAccount,
  CreateNamedSnapAccountProps,
} from './create-named-snap-account';

export default {
  title: 'Components/Multichain/CreateNamedSnapAccount',
  component: CreateNamedSnapAccount,
};

export const DefaultStory = (args: CreateNamedSnapAccountProps) => (
  <CreateNamedSnapAccount {...args} />
);
DefaultStory.storyName = 'Default';
