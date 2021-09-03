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
  const symbol = text('symbol', 'META');
  const image = text('Icon URL', 'metamark.svg');

  const state = store.getState();
  const suggestedTokensState = state.metamask.suggestedTokens;

  useEffect(() => {
    suggestedTokensState[
      '0x6b175474e89094c44da98b954eedeac495271d0f'
    ].symbol = symbol;
    const newState = Object.assign(state.metamask, {
      suggestedTokens: suggestedTokensState,
    });
    store.dispatch(updateMetamaskState(newState));
  }, [symbol, suggestedTokensState]);
  useEffect(() => {
    suggestedTokensState[
      '0x6b175474e89094c44da98b954eedeac495271d0f'
    ].image = image;
    const newState = Object.assign(state.metamask, {
      suggestedTokens: suggestedTokensState,
    });
    store.dispatch(updateMetamaskState(newState));
  }, [image, suggestedTokensState]);

  return children;
};

export const AddSuggestedToken = () => {
  const state = store.getState();
  const newState = Object.assign(state.metamask, {
    suggestedTokens,
  });
  store.dispatch(updateMetamaskState(newState));

  return (
    <PageSet>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
