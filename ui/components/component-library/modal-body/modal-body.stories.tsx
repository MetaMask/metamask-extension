import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ModalBody } from './modal-body';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalBody',
  component: ModalBody,
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
} as Meta<typeof ModalBody>;

const Template: StoryFn<typeof ModalBody> = (args) => <ModalBody {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
