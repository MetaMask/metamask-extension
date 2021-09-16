import React from 'react';
import ConfirmSendToken from './confirm-send-token.component';

export default {
  title: 'Confirmation Screens',
  id: __filename,
};

const PageSet = ({ children }) => children;

export const SendToken = () => (
  <PageSet>
    <ConfirmSendToken />
  </PageSet>
);
