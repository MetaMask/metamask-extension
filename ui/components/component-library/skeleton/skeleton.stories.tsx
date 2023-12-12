import React from 'react';
import type { Meta } from '@storybook/react';
import { BorderRadius } from '../../../helpers/constants/design-system';
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
  return (
    <>
      <Skeleton
        {...args}
        borderRadius={BorderRadius.full}
        style={{ width: 48, height: 48, borderRadius: 999 }}
      />
      <Skeleton {...args} />
    </>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
