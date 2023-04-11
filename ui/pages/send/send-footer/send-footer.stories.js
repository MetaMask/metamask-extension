import React from 'react';

import SendFooter from './send-footer.component';

export default {
  title: 'Pages/Send/SendFooter',

  argTypes: {
    clearSend: { action: 'clearSend' },
    sign: { action: 'sign' },
    from: { control: 'object' },
    disabled: { control: 'boolean' },
    mostRecentOverviewPage: { control: 'text' },
    sendErrors: { control: 'object' },
    history: { action: 'history' },
    resetSendState: { action: 'resetSendState' },
  },
};

export const DefaultStory = (args) => {
  return <SendFooter {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  from: {
    address: '',
  },
  disabled: false,
  mostRecentOverviewPage: '',
  sendErrors: {},
};
