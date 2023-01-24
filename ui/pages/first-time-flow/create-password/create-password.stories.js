import React from 'react';
import { action } from '@storybook/addon-actions';
import ImportWithSeedPhrase from './import-with-seed-phrase/import-with-seed-phrase.component';
import NewAccount from './new-account';

export default {
  title: 'Pages/FirstTimeFlow/CreatePassword',
};

export const ImportWithSeedPhraseComponent = () => {
  return <ImportWithSeedPhrase onSubmit={action('Seed Phrase Imported')} />;
};

export const NewAccountComponent = () => {
  return <NewAccount onSubmit={action('New Account Created')} />;
};
