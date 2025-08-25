import React from 'react';
import PasswordChangedModal from './password-outdated-modal';

export default {
  title: 'Components/App/PasswordOutdatedModal',
  component: PasswordChangedModal,
};

export const DefaultStory = () => {
  return (
    <>
      <PasswordChangedModal />
    </>
  );
};

DefaultStory.storyName = 'Default';
