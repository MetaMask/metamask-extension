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
  params.id = 1906703652727041;
  return children;
};

export const ApproveTokens = () => {
  // useEffect for creating Redux knobs
  useEffect(() => {
    store.dispatch(
      updateMetamaskState({
        // stateUpdateHere
      }),
    );
  });

  return (
    <PageSet>
      <ConfirmApprove />
    </PageSet>
  );
};
