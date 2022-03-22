import React from 'react';
import QrCodeView from '.';

export default {
  title: 'Components/UI/QrCodeView',
  id: __filename,
  argTypes: {
    warning: {
      control: 'text',
    },
    Qr: {
      control: 'object',
    },
  },
  args: {
    warning: 'This is a warning',
    Qr: {
      message: <div>message</div>,
      data: 'data',
    },
  },
};

export const DefaultStory = (args) => (
  <QrCodeView {...args} warning="this is a warning" />
);

DefaultStory.storyName = 'Default';
