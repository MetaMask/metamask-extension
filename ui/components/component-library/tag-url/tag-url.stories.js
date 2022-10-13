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
    imageSource: {
      control: 'text',
    },
    cta: {
      control: 'object',
    },
  },
  args: {
    label: 'https://app.uniswap.org',
    imageSource: 'https://uniswap.org/favicon.ico',
    cta: {
      label: '',
    },
  },
};

const Template = (args) => {
  return <TagUrl {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const WithCta = (args) => <TagUrl {...args} cta={{ label: 'Action' }} />;

export const TextOverflow = (args) => (
  <TagUrl
    {...args}
    label="https://aohfioahonrfrishparhpahrigpahvgbjnbhgvbjnkhb"
  />
);
