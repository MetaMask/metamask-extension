import React from 'react';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import {
  CreateNamedSnapAccount,
  CreateNamedSnapAccountProps,
} from './create-named-snap-account';

export default {
  title: 'Components/Multichain/CreateNamedSnapAccount',
  component: CreateNamedSnapAccount,
  args: {
    address: createMockInternalAccount({ name: 'New account' }).address,
    snapSuggestedAccountName: 'Suggested Account Name',
  },
};

export const DefaultStory = (args: CreateNamedSnapAccountProps) => (
  <CreateNamedSnapAccount {...args} />
);
DefaultStory.storyName = 'Default';
