import React from 'react';

import ConfirmTransactionBase from '.';

export default {
  title: 'Confirmation Screens',
  id: __filename,
};

const PageSet = ({ children }) => children;

export const ConfirmTransactionBaseComponent = () => (
  <PageSet>
    <ConfirmTransactionBase />
  </PageSet>
);
