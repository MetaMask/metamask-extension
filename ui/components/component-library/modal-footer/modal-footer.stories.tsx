import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ModalFooter } from './modal-footer';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalFooter',
  component: ModalFooter,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
  },
} as Meta<typeof ModalFooter>;

const Template: StoryFn<typeof ModalFooter> = (args) => (
  <ModalFooter {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
