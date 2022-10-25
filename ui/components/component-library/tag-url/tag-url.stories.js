import React from 'react';
import README from './README.mdx';
import { TagUrl } from './tag-url';

export default {
  title: 'Components/ComponentLibrary/TagUrl',
  id: __filename,
  component: TagUrl,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    avatarFaviconImageSource: {
      control: 'text',
    },
    cta: {
      control: 'object',
    },
  },
  args: {
    label:
      'https://app.uniswap.orghttps://app.uniswap.orghttps://app.uniswap.orghttps://app.uniswap.orghttps://app.uniswap.org',
    avatarFaviconImageSource: 'https://uniswap.org/favicon.ico',
  },
};

const Template = (args) => <TagUrl {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const ActionButtonLabel = Template.bind({});
ActionButtonLabel.args = {
  actionButtonLabel: 'Permissions',
};
