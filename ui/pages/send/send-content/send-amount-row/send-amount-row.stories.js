import React from 'react';
import { text, boolean } from '@storybook/addon-knobs';
import { Provider } from 'react-redux';

import { ASSET_TYPES } from '../../../../ducks/send';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import SendAmountRow from './send-amount-row.component';

const store = configureStore(testData);

export default {
  title: 'SendAmountRow',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const SendAmountComponent = () => {
  const { metamask } = store.getState();
  const { tokens } = metamask;

  console.log('tokens', store.getState());
  const asset = {
    type: ASSET_TYPES.NATIVE,
    details: {
      address: tokens[0].address,
      decimals: tokens[0].decimals,
      symbol: tokens[0].symbol,
    },
  };
  return (
    <SendAmountRow
      amount={text('Amount', '100000000000000')}
      inError={boolean('In Error', false)}
      asset={asset}
    />
  );
};
