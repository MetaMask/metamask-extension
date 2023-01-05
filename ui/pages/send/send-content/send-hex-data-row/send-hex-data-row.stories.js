import React from 'react';
import SendHexDataRow from './send-hex-data-row.component';

export default {
  title: 'Pages/Send/SendContent/SendHexDataRow',

  argTypes: {
    inError: { control: 'boolean' },
    updateSendHexData: { action: 'updateSendHexData' },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: 450 }}>
      <SendHexDataRow {...args} updateSendHexData={() => null} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  inError: false,
};
