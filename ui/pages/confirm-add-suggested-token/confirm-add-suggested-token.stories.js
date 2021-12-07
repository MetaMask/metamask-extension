/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { store, getNewState } from '../../../.storybook/preview';
import { suggestedAssets } from '../../../.storybook/initial-states/approval-screens/add-suggested-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddSuggestedToken from '.';

export default {
  title: 'Pages/ConfirmAddSuggestedToken',
  id: __filename,
};

const PageSet = ({ children }) => {
  const symbol = text('symbol', 'META');
  const image = text('Icon URL', 'metamark.svg');

  const state = store.getState();
  const suggestedAssetsState = state.metamask.suggestedAssets;

  useEffect(() => {
    suggestedAssetsState[0].symbol = symbol;
    store.dispatch(
      updateMetamaskState(
        getNewState(state.metamask, {
          suggestedAssets: suggestedAssetsState,
        }),
      ),
    );
  }, [symbol, suggestedAssetsState, state.metamask]);
  useEffect(() => {
    suggestedAssetsState[0].image = image;
    store.dispatch(
      updateMetamaskState(
        getNewState(state.metamask, {
          suggestedAssets: suggestedAssetsState,
        }),
      ),
    );
  }, [image, suggestedAssetsState, state.metamask]);

  return children;
};

export const DefaultStory = () => {
  const state = store.getState();
  store.dispatch(
    updateMetamaskState(
      getNewState(state.metamask, {
        suggestedAssets,
      }),
    ),
  );

  return (
    <PageSet>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
