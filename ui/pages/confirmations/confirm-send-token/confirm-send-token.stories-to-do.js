import React from 'react';
import ConfirmSendToken from './confirm-send-token.component';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Pages/ConfirmSendToken',
};

const PageSet = ({ children }) => {
  return children;
};

export const DefaultStory = () => {
  return (
    <PageSet>
      <ConfirmSendToken />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
