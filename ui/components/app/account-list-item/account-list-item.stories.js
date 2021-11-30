import React from 'react';
import { store } from '../../../../.storybook/preview';
import README from './README.mdx';
import AccountListItem from './account-list-item';

const { metamask } = store.getState();
const { addresses } = metamask;

export default {
  title: 'Components/App/AccountListItem',
  id: __filename,
  component: AccountListItem,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    account: {
      control: 'object',
    },
    className: { control: 'text' },
    displayAddress: { control: 'boolean' },
    handleClick: { action: 'clicked' },
    icon: { control: 'object' },
  },
};

export const DefaultStory = (args) => {
  return <AccountListItem {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  account: Object.values(addresses)[0],
  displayAddress: false,
};

DefaultStory.storyName = 'Default';
