/* eslint-disable react/prop-types */

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../.storybook/test-data';
import { calcGasTotal } from '../../../../../shared/lib/transactions-controller-utils';
import { GAS_INPUT_MODES } from '../../../../ducks/send';
import { updateMetamaskState } from '../../../../store/actions';
import configureStore from '../../../../store/store';
import README from './README.mdx';
import SendGasRow from './send-gas-row.component';

const store = configureStore(testData);

export default {
  title: 'Pages/Send/SendContent/SendGasRow',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    insufficientBalance: {
      control: { type: 'boolean' },
    },
  },
  args: {
    insufficientBalance: false,
  },
};

export const DefaultStory = (args) => {
  const state = store.getState();
  const { metamask } = state;
  const { send } = metamask;
  const [sendState, setSendState] = useState(send);

  useEffect(() => {
    const newState = Object.assign(metamask, {
      send: sendState,
    });
    store.dispatch(updateMetamaskState(newState));
  }, [sendState, metamask]);

  const updateGasPrice = ({ gasPrice, gasLimit }) => {
    let newGasTotal = send.gasTotal;
    if (send.gasLimit) {
      newGasTotal = calcGasTotal(gasLimit, gasPrice);
    }
    const newState = {
      ...state.metamask.send,
      gasPrice,
      gasTotal: newGasTotal,
    };

    setSendState(newState);
  };

  const updateGasLimit = (limit) => {
    let newGasTotal = send.gasTotal;
    if (send.gasPrice) {
      newGasTotal = calcGasTotal(limit, send.gasPrice);
    }
    const newState = {
      ...state.metamask.send,
      gasLimit: limit,
      gasTotal: newGasTotal,
    };

    setSendState(newState);
  };

  return (
    <div style={{ width: 500 }}>
      <SendGasRow
        {...args}
        updateGasPrice={updateGasPrice}
        updateGasLimit={updateGasLimit}
        gasPrice={send.gasPrice}
        gasLimit={send.gasLimit}
        gasInputMode={GAS_INPUT_MODES.INLINE}
      />
    </div>
  );
};

DefaultStory.storyName = 'SendGasRow';
