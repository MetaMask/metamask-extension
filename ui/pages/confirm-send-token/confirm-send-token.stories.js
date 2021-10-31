import React from 'react';
import ConfirmSendToken from './confirm-send-token.component';

export default {
  title: 'Pages/Confirm Send Token',
  id: __filename,
};

const PageSet = ({ children }) => {
  return children;
};

export const Base = () => {
  return (
    <PageSet>
      <ConfirmSendToken />
    </PageSet>
  );
};
