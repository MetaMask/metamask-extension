import React from 'react';
import README from './README.mdx';
import AlertCircleIcon from './alert-circle-icon.component';

export default {
  title: 'Components/UI/AlertCircleIcon',
  id: __filename,
  component: AlertCircleIcon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    type: { options: ['warning', 'danger'], control: { type: 'select' } },
  },
};

export const DefaultStory = (args) => <AlertCircleIcon type={args.type} />;

DefaultStory.storyName = 'Default';

export const Warning = (args) => <AlertCircleIcon type={args.type} />;

Warning.args = {
  type: 'warning',
};
