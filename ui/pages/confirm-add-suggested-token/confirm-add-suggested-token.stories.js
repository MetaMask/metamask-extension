/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { store } from '../../../.storybook/preview';
import { suggestedTokens } from '../../../.storybook/initial-states/approval-screens/add-suggested-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddSuggestedToken from '.';

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
  const suggestedTokensState = state.metamask.suggestedTokens;

  useEffect(() => {
    suggestedTokensState[
      '0x6b175474e89094c44da98b954eedeac495271d0f'
    ].symbol = symbol;
    store.dispatch(
      updateMetamaskState({ suggestedTokens: suggestedTokensState }),
    );
  }, [symbol, suggestedTokensState]);
  useEffect(() => {
    suggestedTokensState[
      '0x6b175474e89094c44da98b954eedeac495271d0f'
    ].image = image;
    store.dispatch(
      updateMetamaskState({ suggestedTokens: suggestedTokensState }),
    );
  }, [image, suggestedTokensState]);

  return children;
};

export const AddSuggestedToken = () => {
  store.dispatch(updateMetamaskState({ suggestedTokens }));
  return (
    <PageSet>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
