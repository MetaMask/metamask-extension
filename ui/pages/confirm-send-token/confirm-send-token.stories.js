import ConfirmSendToken from './confirm-send-token.component';
import React from 'react';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  return children;
};

export const SendToken = () => {
  return (
    <PageSet>
      <ConfirmSendToken />
    </PageSet>
  );
};
