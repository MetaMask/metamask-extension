import React from 'react';
import Dialog from '.';

export default {
  title: 'Components/UI/Dialog',
  id: __filename,
  component: Dialog,
  argsTypes: {
    children: {
      control: 'text',
    },
    type: { control: 'text' },
  },
};

export const DefaultDialog = (args) => {
  return <Dialog {...args} />;
};

DefaultDialog.storyName = 'Default';
DefaultDialog.args = {
  type: 'error',
  children: 'Dialog Box',
};
