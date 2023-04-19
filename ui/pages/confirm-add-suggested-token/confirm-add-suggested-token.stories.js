/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
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
    symbol: {
      control: 'text',
      table: { category: 'Data' },
    },
    image: {
      control: 'text',
      table: { category: 'Data' },
    },
  },
  args: {
    symbol: 'ETH',
    image: './images/eth_logo.svg',
  },
};

const { metamask: state } = store.getState();

const PageSet = ({ children, suggestedAssets, tokens, symbol, image }) => {
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

export const DefaultStory = (args) => {
  return (
    <PageSet {...args}>
      <ConfirmAddSuggestedToken />
    </PageSet>
  );
};
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  suggestedAssets: [...mockSuggestedAssets],
  tokens: [],
};

export const WithDuplicateAddress = (args) => {
  return (
    <PageSet {...args}>
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

export const WithDuplicateSymbolAndDifferentAddress = (args) => {
  return (
    <PageSet {...args}>
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
