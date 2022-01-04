import React from 'react';

import SendFooter from './send-footer.component';

export default {
  title: 'Pages/Send/SendFooter',
  id: __filename,
  argTypes: {
    clearSend: { action: 'Cancel Button Pressed' },
    sign: { action: 'Next Button Pressed' },
    from: { control: 'object' },
    disabled: { control: 'boolean' },
    mostRecentOverviewPage: { control: 'text' },
    sendErrors: { control: 'object' },
  },
};

export const DefaultStory = (args) => {
  return (
    <SendFooter
      {...args}
      history={{ push: () => undefined }}
      addToAddressBookIfNew={() => undefined}
      resetSendState={() => undefined}
    />
  );
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
