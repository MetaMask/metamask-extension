import React from 'react';

import ConfirmTransactionBase from '.';

export default {
  title: 'Pages/Confirmation Screens/Confirm Transaction Base',
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
