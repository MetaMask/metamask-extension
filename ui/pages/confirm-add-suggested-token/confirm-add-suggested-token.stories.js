/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import {
  currentNetworkTxListSample,
  domainMetadata,
} from '../../../.storybook/initial-states/approval-screens/token-approval';

import ConfirmAddSuggestedToken from '.';
import { currentNetworkTxListSelector } from '../../selectors/transactions';
import { store } from '../../../.storybook/preview';
import {suggestedTokens} from '../../../.storybook/initial-states/approval-screens/add-suggested-token'
import { text } from '@storybook/addon-knobs';
import { updateMetamaskState } from '../../store/actions';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default {
  title: 'Confirmation Screens',
};

const PageSet = ({ children }) => {

  const symbol = text('symbol', 'DAI');
  const image = text(
    'Icon URL',
    'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png?1574218774',
  );

  const state = store.getState();
  const suggestedTokensState = state.metamask.suggestedTokens

  useEffect(() => {
    suggestedTokensState["0x6b175474e89094c44da98b954eedeac495271d0f"].symbol = symbol
    store.dispatch(
      updateMetamaskState({ suggestedTokens: suggestedTokensState})
      
    );
  }, [symbol]);
  useEffect(() => {
    suggestedTokensState["0x6b175474e89094c44da98b954eedeac495271d0f"].image = image
    store.dispatch(
      updateMetamaskState({ suggestedTokens: suggestedTokensState})
    );
  }, [image]);

  return children;
};

export const AddSuggestedToken = () => {
  // store.dispatch(
  //   updateMetamaskState({ currentNetworkTxList: [currentNetworkTxListSample] }),
  // );
  // store.dispatch(updateMetamaskState({ domainMetadata }));
  store.dispatch(updateMetamaskState({ suggestedTokens: suggestedTokens}))
  return (
    <PageSet>
       <ConfirmAddSuggestedToken />
    </PageSet>
   
   
  );
};
