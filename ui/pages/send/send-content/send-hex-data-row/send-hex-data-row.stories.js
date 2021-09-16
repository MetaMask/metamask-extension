import React from 'react';
import { boolean } from '@storybook/addon-knobs';
import SendHexDataRow from './send-hex-data-row.component';

export default {
  title: 'SendHexDataRow',
  id: __filename,
};

export const SendHexDataRowComponent = () => {
  return (
    <div style={{ width: 450 }}>
      <SendHexDataRow
        inError={boolean('In Error', false)}
        updateSendHexData={() => null}
      />
    </div>
  );
};
