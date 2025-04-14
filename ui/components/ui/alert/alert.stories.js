import React from 'react';
import README from './README.mdx';
import Alert from '.';

export default {
  title: 'Components/UI/Alert',

  component: Alert,
  parameters: {
    docs: {
      page: README,
    },
  },
  argsTypes: {
    visible: {
      control: 'boolean',
    },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
    msg: {
      control: 'text',
    },
  },
};

export const DefaultAlert = (args) => {
  return <Alert {...args} />;
};

DefaultAlert.storyName = 'Default';
DefaultAlert.args = {
  visible: true,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  msg: 'Alert',
};
