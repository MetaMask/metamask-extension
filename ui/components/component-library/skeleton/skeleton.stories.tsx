import React from 'react';
import type { Meta } from '@storybook/react';
import README from './README.mdx';
import { Skeleton } from '.';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/ComponentLibrary/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {},
};

export default meta;

const Template = (args) => {
  return <Skeleton {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
