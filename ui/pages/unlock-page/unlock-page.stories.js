import React from 'react';
import { action } from '@storybook/addon-actions';
import UnlockPage from './unlock-page.component';

export default {
  title: 'Pages/UnlockPage',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <UnlockPage
      onSubmit={action('Login')}
      forceUpdateMetamaskState={() => ({
        participateInMetaMetrics: true,
      })}
      showOptInModal={() => null}
      history={{}}
    />
  );
};

DefaultStory.storyName = 'Default';
