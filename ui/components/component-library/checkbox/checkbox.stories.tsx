import { Meta } from '@storybook/react';
import React from 'react';

import README from './README.mdx';
import { Checkbox } from '.';

export default {
  title: 'Components/ComponentLibrary/Checkbox',

  component: Checkbox,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
  args: {},
} as Meta<typeof Checkbox>;

export const DefaultStory = (args) => <Checkbox {...args} />;

DefaultStory.storyName = 'Default';

export const Test = () => <Checkbox />;
