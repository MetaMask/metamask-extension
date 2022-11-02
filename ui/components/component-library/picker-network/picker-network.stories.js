import React from 'react';
import README from './README.mdx';
import { PickerNetwork } from './picker-network';

export default {
  title: 'Components/ComponentLibrary/PickerNetwork',
  id: __filename,
  component: PickerNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
    src: './images/avax-token.png',
  },
};

export const DefaultStory = (args) => <PickerNetwork {...args} />;

DefaultStory.storyName = 'Default';
