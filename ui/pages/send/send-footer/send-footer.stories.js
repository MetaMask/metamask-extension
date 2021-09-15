import React from 'react';
import { action } from '@storybook/addon-actions';
import { boolean } from '@storybook/addon-knobs';

import SendFooter from './send-footer.component';

export default {
  title: 'SendFooter',
  id: __filename,
};

export const SendFooterComponent = () => {
  const disabled = boolean('Disabled', false);
  return (
    <SendFooter
      clearSend={() => action('Cancel Button Pressed')()}
      sign={() => action('Next Button Pressed')()}
      // The other props below are only to make the component show no error
      from={{ address: '' }}
      history={{ push: () => undefined }}
      addToAddressBookIfNew={() => undefined}
      disabled={disabled}
      mostRecentOverviewPage=""
      resetSendState={() => undefined}
      sendErrors={{}}
    />
  );
};
