import React from 'react';

import ConfirmTransactionBase from '.';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Pages/ConfirmTransactionBase',
};

const PageSet = ({ children }) => {
  return children;
};

export const DefaultStory = () => {
  return (
    <PageSet>
      <ConfirmTransactionBase />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
