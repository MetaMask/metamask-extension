import React from 'react';
import Player from './player';

export default {
  title: 'Components/App/Player',
  component: Player,
  argTypes: {
    type: {
      control: 'text',
    },
    cbor: {
      control: 'text',
    },
    cancelQRHardwareSignRequest: {
      action: 'cancelQRHardwareSignRequest',
    },
    toRead: {
      action: 'toRead',
    },
  },
  args: {
    type: 'abc',
    cbor: 'abc',
  },
};

export const DefaultStory = (args) => <Player {...args} />;

DefaultStory.storyName = 'Default';
