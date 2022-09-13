import React from 'react';

import ConfirmTransactionBase from '.';

export default {
  title: 'Pages/ConfirmTransactionBase',
  id: __filename,
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
