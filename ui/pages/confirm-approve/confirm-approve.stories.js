/* eslint-disable react/prop-types */
import React from 'react';
// import { object, number, select, text } from '@storybook/addon-knobs';
import { useParams } from 'react-router-dom';
import ConfirmApprove from '.';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  const params = useParams();
  // transaction ID: maps to a transaction in state.metamask.currentNetworkTxList
  params.id = 1906703652727041;
  return children;
};

export const ApproveTokens = () => {
  return (
    <PageSet>
      <ConfirmApprove />
    </PageSet>
  );
};
