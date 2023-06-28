import React from 'react';
import { DISCLOSURE_TYPES } from './disclosure.constants';
import Disclosure from '.';

export default {
  title: 'Components/UI/Disclosure', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    children: {
      control: 'text',
    },
    size: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    type: {
      control: {
        type: 'select',
      },
      options: [...Object.values(DISCLOSURE_TYPES)],
    },
  },
  args: {
    children: 'hello world',
    size: 'normal',
    title: 'title',
  },
};

export const DefaultStory = (args) => <Disclosure {...args} />;
DefaultStory.storyName = 'Default';

export const TypeArrow = (args) => (
  <Disclosure type={DISCLOSURE_TYPES.ARROW} {...args} />
);
