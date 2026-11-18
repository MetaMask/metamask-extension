import React from 'react';
import RiveWasmProvider from '../../../contexts/rive-wasm';
import CreationSuccessful from './creation-successful';

export default {
  title: 'Pages/OnboardingFlow/CreationSuccessful',
};

const CreationSuccessfulStory = () => {
  return (
    <RiveWasmProvider>
      <CreationSuccessful />
    </RiveWasmProvider>
  );
};

export const DefaultStory = () => <CreationSuccessfulStory />;

DefaultStory.storyName = 'Wallet ready';

export const SrpBackupReminderStory = () => <CreationSuccessfulStory />;

SrpBackupReminderStory.storyName = 'SRP backup reminder';
SrpBackupReminderStory.parameters = {
  initialEntries: ['/?isFromReminder=true'],
};
