import React from 'react';
import QrCodeView from '.';

export default {
  title: 'Components/UI/QrCodeView',

  argTypes: {
    Qr: {
      control: 'object',
    },
  },
  args: {
    Qr: {
      message: <div>message</div>,
      data: 'data',
    },
  },
};

export const DefaultStory = (args) => <QrCodeView {...args} />;

DefaultStory.storyName = 'Default';
