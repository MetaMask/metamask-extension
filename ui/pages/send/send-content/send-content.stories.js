import React from 'react';
import { boolean, text } from '@storybook/addon-knobs';

import SendContent from './send-content.component';

export default {
  title: 'SendContent',
};

export const SendContentComponent = () => {
  return (
    <SendContent
      showHexData={boolean('Show Hex Data', false)}
      isOwnedAccount={boolean('Is In Address Book', true)}
      noGasPrice={boolean('No Gas Price', false)}
      isEthGasPrice={boolean('Backup Gas Price', false)}
      gasIsExcessive={boolean('Gas Is Excessive', false)}
      // Get error and warning message from messages.json
      error={text('Error', 'connecting')}
      warning={text('Warning', 'connecting')}
    />
  );
};
