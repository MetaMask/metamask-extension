import React from 'react';
import PropTypes from 'prop-types';
import { boolean } from '@storybook/addon-knobs';
import { Provider, useSelector } from 'react-redux';
import { action } from '@storybook/addon-actions';

import { ASSET_TYPES, getSendAmount } from '../../../../ducks/send';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import SendAmountRow from './send-amount-row.component';

export default {
  title: 'Pages/Send/Send Content/Send Amount Row',
  id: __filename,
};

const ProviderWrapper = ({ children, store }) => {
  return <Provider store={store}>{children}</Provider>;
};

ProviderWrapper.propTypes = {
  children: PropTypes.object,
  store: PropTypes.any,
};

const UsingReduxComponent = () => {
  const sendAmount = useSelector(getSendAmount);

  const asset = {
    type: ASSET_TYPES.NATIVE,
    details: {
      address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
      symbol: 'DAI',
      decimals: 18,
    },
  };

  return (
    <div style={{ width: 400 }}>
      <SendAmountRow
        asset={asset}
        amount={sendAmount}
        inError={boolean('In Error', false)}
        updateSendAmount={(amount) => action(`Update send Amount ${amount}`)()}
      />
    </div>
  );
};

export const SendAmountComponent = () => {
  const store = configureStore(testData);

  return (
    <ProviderWrapper store={store}>
      <UsingReduxComponent />
    </ProviderWrapper>
  );
};
