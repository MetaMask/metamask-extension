/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { text } from '@storybook/addon-knobs';
import { store, getNewState } from '../../../.storybook/preview';
import { suggestedAssets as mockSuggestedAssets } from '../../../.storybook/initial-states/approval-screens/add-suggested-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddSuggestedToken from '.';

export default {
  title: 'Pages/ConfirmAddSuggestedToken',

  argTypes: {
    tokens: {
      control: 'array',
      table: { category: 'Data' },
    },
    suggestedAssets: {
      control: 'array',
      table: { category: 'Data' },
    },
  },
};

const { metamask: state } = store.getState();

const PageSet = ({ children, suggestedAssets, tokens }) => {
  const symbol = text('symbol', 'META');
  const image = text('Icon URL', 'metamark.svg');

  useEffect(() => {
    if (!suggestedAssets?.length) {
      return;
    }

    suggestedAssets[0].asset.image = image;
    suggestedAssets[0].asset.symbol = symbol;

    store.dispatch(
      updateMetamaskState(
        getNewState(state, {
          suggestedAssets,
        }),
      ),
    );
  }, [image, suggestedAssets, symbol]);

  useEffect(() => {
    store.dispatch(
      updateMetamaskState(
        getNewState(state, {
          tokens,
        }),
      ),
    );
  }, [tokens]);

  return children;
};

export const DefaultStory = ({ suggestedAssets, tokens }) => {
  return (
    <PageSet suggestedAssets={suggestedAssets} tokens={tokens}>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  suggestedAssets: [...mockSuggestedAssets],
  tokens: [],
};

export const WithDuplicateAddress = ({ suggestedAssets, tokens }) => {
  return (
    <PageSet suggestedAssets={suggestedAssets} tokens={tokens}>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
WithDuplicateAddress.args = {
  suggestedAssets: [...mockSuggestedAssets],
  tokens: [
    {
      ...mockSuggestedAssets[0].asset,
    },
  ],
};

export const WithDuplicateSymbolAndDifferentAddress = ({
  suggestedAssets,
  tokens,
}) => {
  return (
    <PageSet suggestedAssets={suggestedAssets} tokens={tokens}>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
WithDuplicateSymbolAndDifferentAddress.args = {
  suggestedAssets: [...mockSuggestedAssets],
  tokens: [
    {
      ...mockSuggestedAssets[0].asset,
      address: '0xNonSuggestedAddress',
    },
  ],
};
