import React from 'react';
import PasswordChangedModal from './password-outdated-modal';

export default {
  title: 'Components/App/PasswordChangedModal',
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
