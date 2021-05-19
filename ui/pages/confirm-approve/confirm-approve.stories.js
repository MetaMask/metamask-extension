/* eslint-disable react/prop-types */

import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { useParams } from 'react-router-dom';
import { updateMetamaskState } from '../../store/actions';
import { useSelector } from 'react-redux';
import { currentNetworkTxListSelector } from '../../selectors/transactions';
import { store } from '../../../.storybook/preview';
import { currentNetworkTxListSample, domainMetadata }  from '../../../.storybook/initial-states/approval-screens/token-approval'
import ConfirmApprove from '.';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {
  const knob = text("Origin", "https://metamask.github.io")
  const currentNetworkTxList = useSelector(currentNetworkTxListSelector);

  useEffect(() => {
    const transaction = currentNetworkTxList.find(({ id }) => id === 7900715443136469);
    transaction.origin = knob
    store.dispatch(updateMetamaskState({ currentNetworkTxList: [transaction] }))
  }, [knob])
  
  const params = useParams();
  params.id = 7900715443136469;
  return children;
};

export const ApproveTokens = () => {
  store.dispatch(updateMetamaskState({ currentNetworkTxList: [currentNetworkTxListSample] }))

  return (
    <PageSet>
      <ConfirmApprove />
    </PageSet>
  );
};
