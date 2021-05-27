/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateMetamaskState } from '../../store/actions';
import { currentNetworkTxListSelector } from '../../selectors/transactions';
import { store } from '../../../.storybook/preview';

import {
  currentNetworkTxListSample,
  domainMetadata,
} from '../../../.storybook/initial-states/approval-screens/token-approval';
import ConfirmApprove from '.';

export default {
  title: 'Confirmation Screens',
};

// transaction ID, maps to entry in state.metamask.currentNetworkTxList
const txId = 7900715443136469;

const PageSet = ({ children }) => {
  const origin = text('Origin', 'https://metamask.github.io');
  const domainIconUrl = text(
    'Icon URL',
    'https://metamask.github.io/test-dapp/metamask-fox.svg',
  );

  const currentNetworkTxList = useSelector(currentNetworkTxListSelector);
  const transaction = currentNetworkTxList.find(({ id }) => id === txId);

  useEffect(() => {
    transaction.origin = origin;
    store.dispatch(
      updateMetamaskState({ currentNetworkTxList: [transaction] }),
    );
  }, [origin, transaction]);

  useEffect(() => {
    store.dispatch(
      updateMetamaskState({
        domainMetadata: {
          [origin]: {
            icon: domainIconUrl,
          },
        },
      }),
    );
  }, [domainIconUrl, origin]);

  const params = useParams();
  params.id = txId;
  return children;
};

export const ApproveTokens = () => {
  store.dispatch(
    updateMetamaskState({ currentNetworkTxList: [currentNetworkTxListSample] }),
  );
  store.dispatch(updateMetamaskState({ domainMetadata }));
  return (
    <PageSet>
      <ConfirmApprove />
    </PageSet>
  );
};
