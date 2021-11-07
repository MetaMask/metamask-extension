import React from 'react';

import ConfirmTransactionBase from '.';

export default {
  title: 'Pages/Confirm Transaction Base',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const Base = () => {
  return (
    <PageSet>
      <ConfirmTransactionBase />
    </PageSet>
  );
};
