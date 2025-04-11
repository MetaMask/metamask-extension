import React from 'react';

import Alert from '.';
import README from './README.mdx';

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
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31889
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
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  msg: 'Alert',
};
