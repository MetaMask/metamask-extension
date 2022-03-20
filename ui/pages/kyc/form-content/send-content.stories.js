import React from 'react';
import { boolean, text } from '@storybook/addon-knobs';

import FormContent from './form-content.component';

export default {
  title: 'Pages/Send/FormContent',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <FormContent
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

DefaultStory.storyName = 'Default';
