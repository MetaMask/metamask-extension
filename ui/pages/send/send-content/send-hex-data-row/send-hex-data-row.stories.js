import React from 'react';
import { boolean } from '@storybook/addon-knobs';
import SendHexDataRow from './send-hex-data-row.component';

export default {
  title: 'Pages/Send/SendContent/SendHexDataRow',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ width: 450 }}>
      <SendHexDataRow
        inError={boolean('In Error', false)}
        updateSendHexData={() => null}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
