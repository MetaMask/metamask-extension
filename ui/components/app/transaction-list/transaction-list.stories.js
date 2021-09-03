/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateMetamaskState } from '../../../store/actions';
import { currentNetworkTxListSelector } from '../../../selectors/transactions';
import { store } from '../../../../.storybook/preview';
import TransactionList from '.';

export default {
  title: 'Transaction List',
};

// transaction ID, maps to entry in state.metamask.currentNetworkTxList
const txId = 7900715443136469;

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
