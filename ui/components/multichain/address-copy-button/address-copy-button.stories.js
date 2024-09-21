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

export const ShortenedStory = (args) => <AddressCopyButton {...args} />;
ShortenedStory.storyName = 'Shortened';
ShortenedStory.args = { shorten: true };

export const WrappedStory = (args) => (
  <div style={{ width: '200px' }}>
    <AddressCopyButton {...args} />
  </div>
);
WrappedStory.storyName = 'Wrapped';
WrappedStory.args = { wrap: true };
