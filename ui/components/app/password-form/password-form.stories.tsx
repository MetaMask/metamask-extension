import React from 'react';
import PasswordForm from './password-form';

export default {
  title: 'Components/App/PasswordForm',
  component: PasswordForm,
};

export const DefaultStory = () => {
  return (
    <>
      <PasswordForm onChange={() => {}} />
    </>
  );
};

DefaultStory.storyName = 'Default';
