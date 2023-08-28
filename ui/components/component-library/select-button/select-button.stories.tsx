import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { SelectButton as SelectButtonComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/SelectButton',
  component: SelectButtonComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
} as Meta<typeof SelectButtonComponent>;

const SelectButton: StoryFn<typeof SelectButtonComponent> = (args) => {
  return <SelectButtonComponent {...args} />;
};

export const DefaultStory = SelectButton.bind({});
DefaultStory.storyName = 'Default';

export const Demo = SelectButton.bind({});
Demo.args = {};
