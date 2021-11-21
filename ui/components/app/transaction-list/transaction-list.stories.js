/* eslint-disable react/prop-types */
import React from 'react';
import TransactionList from '.';

export default {
  title: 'Transaction List',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const TxList = () => {
  return (
    <PageSet>
      <TransactionList />
    </PageSet>
  );
};
