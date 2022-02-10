/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';

import { text } from '@storybook/addon-knobs';
import { store, getNewState } from '../../../.storybook/preview';
import { tokens } from '../../../.storybook/initial-states/approval-screens/add-token';
import { updateMetamaskState } from '../../store/actions';
import ConfirmAddToken from '.';

export default {
  title: 'Pages/ConfirmImportToken',
  id: __filename,

  argTypes: {
    pendingTokens: {
      control: 'object',
      table: { category: 'Data' },
    },
  },
};

const PageSet = ({ children, pendingTokens }) => {
  const { metamask: state } = store.getState();
  const symbol = text('symbol', 'TRDT');
  // only change the first token in the list
  useEffect(() => {
    if (pendingTokens['0x33f90dee07c6e8b9682dd20f73e6c358b2ed0f03']) {
      pendingTokens[
        '0x33f90dee07c6e8b9682dd20f73e6c358b2ed0f03'
      ].symbol = symbol;
    }
    store.dispatch(
      updateMetamaskState(
        getNewState(state, {
          pendingTokens,
        }),
      ),
    );
  }, [state, symbol, pendingTokens]);

  return children;
};

export const DefaultStory = ({ pendingTokens }) => {
  return (
    <PageSet pendingTokens={pendingTokens}>
      <ConfirmAddToken />
    </PageSet>
  );
};
DefaultStory.args = {
  pendingTokens: { ...tokens },
};
DefaultStory.storyName = 'Default';
