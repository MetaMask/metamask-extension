/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { store, getNewState } from '../../../.storybook/preview';
import { suggestedAssets as mockSuggestedAssets } from '../../../.storybook/initial-states/approval-screens/add-suggested-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddSuggestedToken from '.';

export default {
  title: 'Pages/ConfirmAddSuggestedToken',
  id: __filename,
  argTypes: {
    // Data
    tokens: {
      control: 'array',
      table: { category: 'Data' },
    },
    suggestedAssets: {
      control: 'array',
      table: { category: 'Data' },
    },

    // Text
    mostRecentOverviewPage: {
      control: { type: 'text', disable: true },
      table: { category: 'Text' },
    },

    // Events
    acceptWatchAsset: {
      action: 'acceptWatchAsset',
      table: { category: 'Events' },
    },
    history: {
      action: 'history',
      table: { category: 'Events' },
    },
    rejectWatchAsset: {
      action: 'rejectWatchAsset',
      table: { category: 'Events' },
    },
  },
};

const PageSet = ({ children, suggestedAssets }) => {
  const symbol = text('symbol', 'META');
  const image = text('Icon URL', 'metamark.svg');

  const state = store.getState();

  useEffect(() => {
    if (!suggestedAssets.length) {
      return;
    }

    suggestedAssets[0].asset.image = image;
    suggestedAssets[0].asset.symbol = symbol;

    store.dispatch(
      updateMetamaskState(
        getNewState(state.metamask, {
          suggestedAssets,
        }),
      ),
    );
  }, [image, symbol, suggestedAssets, state.metamask]);

  return children;
};

export const DefaultStory = ({ suggestedAssets }) => {
  return (
    <PageSet suggestedAssets={suggestedAssets}>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  mostRecentOverviewPage: '',
  suggestedAssets: [...mockSuggestedAssets],
  tokens: [],
};
