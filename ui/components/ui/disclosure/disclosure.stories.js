import React from 'react';
import { DisclosureVariant } from './disclosure.constants';
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
    variant: {
      control: {
        type: 'select',
      },
      options: [...Object.values(DisclosureVariant)],
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

export const VariantArrow = (args) => (
  <Disclosure variant={DisclosureVariant.Arrow} {...args} />
);
