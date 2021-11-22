import React from 'react';

import ConfirmTransactionBase from '.';

export default {
  title: 'Pages/ConfirmTransactionBase',
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
