/* eslint-disable react/prop-types */

import React, { useEffect } from 'react';
// import { object, number, select, text } from '@storybook/addon-knobs';
import { useParams } from 'react-router-dom';
import { updateMetamaskState } from '../../store/actions';
import { store } from '../../../.storybook/preview';
import ConfirmApprove from '.';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  const params = useParams();
  //transaction ID: maps to a transaction in state.metamask.currentNetworkTxList
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
