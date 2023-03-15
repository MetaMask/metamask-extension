import React from 'react';
import { AddressCopyButton } from '.';

export default {
  title: 'Components/Multichain/AddressCopyButton',
  component: AddressCopyButton,
  argTypes: {
    address: {
      control: 'text',
    },
    shorten: {
      control: 'boolean',
    },
    wrap: {
      control: 'boolean',
    },
  },
  args: {
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  },
};

export const DefaultStory = (args) => <AddressCopyButton {...args} />;
DefaultStory.storyName = 'Default';

export const ShortenedStory = (args) => <AddressCopyButton shorten {...args} />;
ShortenedStory.storyName = 'Shortened';

export const WrappedStory = (args) => (
  <div style={{ width: '200px' }}>
    <AddressCopyButton wrap {...args} />
  </div>
);
WrappedStory.storyName = 'Wrapped';
