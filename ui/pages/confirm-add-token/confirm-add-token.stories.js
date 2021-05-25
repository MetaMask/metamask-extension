/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
  currentNetworkTxListSample,
  domainMetadata,
} from '../../../.storybook/initial-states/approval-screens/token-approval';

import ConfirmAddToken from '.';
import { createBrowserHistory } from "history";
import { currentNetworkTxListSelector } from '../../selectors/transactions';
import { store } from '../../../.storybook/preview';
import { text } from '@storybook/addon-knobs';
import { updateMetamaskState } from '../../store/actions';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default {
  title: 'Confirmation Screens',
};

const history = createBrowserHistory();

const PageSet = ({ children }) => {

  return children;
};

export const AddToken = () => {
  // store.dispatch(
  //   updateMetamaskState({ currentNetworkTxList: [currentNetworkTxListSample] }),
  // );
  // store.dispatch(updateMetamaskState({ domainMetadata }));
  return (
       <ConfirmAddToken
        history={history}
       />
  );
};
