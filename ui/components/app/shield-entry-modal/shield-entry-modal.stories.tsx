import React from 'react';
import ShieldEntryModal from './shield-entry-modal';

export default {
  title: 'Components/App/ShieldEntryModal',
  component: ShieldEntryModal,
};

export const DefaultStory = () => {
  return <ShieldEntryModal onClose={() => {}} onGetStarted={() => {}} />;
};

DefaultStory.storyName = 'Default';
