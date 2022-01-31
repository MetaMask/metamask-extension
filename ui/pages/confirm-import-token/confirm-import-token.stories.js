/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';

import { createBrowserHistory } from 'history';
import { text } from '@storybook/addon-knobs';
import { store, getNewState } from '../../../.storybook/preview';
import { tokens } from '../../../.storybook/initial-states/approval-screens/add-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddToken from '.';

export default {
  title: 'Pages/ConfirmImportToken',
  id: __filename,
};

const history = createBrowserHistory();

const PageSet = ({ children }) => {
  const symbol = text('symbol', 'TRDT');
  const state = store.getState();
  const pendingTokensState = state.metamask.pendingTokens;
  // only change the first token in the list
  useEffect(() => {
    const pendingTokens = { ...pendingTokensState };
    pendingTokens['0x33f90dee07c6e8b9682dd20f73e6c358b2ed0f03'].symbol = symbol;
    store.dispatch(
      updateMetamaskState(
        getNewState(state.metamask, {
          pendingTokens,
        }),
      ),
    );
  }, [symbol, pendingTokensState, state.metamask]);

  return children;
};

export const DefaultStory = () => {
  const { metamask: state } = store.getState();
  store.dispatch(
    updateMetamaskState(
      getNewState(state, {
        pendingTokens: tokens,
      }),
    ),
  );

  return (
    <PageSet>
      <ConfirmAddToken history={history} />
    </PageSet>
  );
};

DefaultStory.storyName = 'Default';
