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
  const origin = text("Origin", "https://metamask.github.io")
  const domainIconUrl = text("Icon URL", "https://metamask.github.io/test-dapp/metamask-fox.svg")
  const currentNetworkTxList = useSelector(currentNetworkTxListSelector);

  useEffect(() => {
    //transaction ID, maps to entry in state.metamask.currentNetworkTxList
    const transaction = currentNetworkTxList.find(({ id }) => id === 7900715443136469);
    transaction.origin = origin
    store.dispatch(updateMetamaskState({ currentNetworkTxList: [transaction] }))
    console.log(store.getState())
  }, [origin])

  useEffect(() => {
    store.dispatch(updateMetamaskState({ domainMetadata: {
      [origin]: {
        icon: domainIconUrl
      }
    } }))
    console.log(store.getState())
  }, [domainIconUrl])
  
  const params = useParams();
  params.id = 7900715443136469;
  return children;
};

export const ApproveTokens = () => {
  store.dispatch(updateMetamaskState({ currentNetworkTxList: [currentNetworkTxListSample] }))
  store.dispatch(updateMetamaskState({ domainMetadata: domainMetadata }))
  return (
    <PageSet>
      <ConfirmApprove />
    </PageSet>
  );
};
