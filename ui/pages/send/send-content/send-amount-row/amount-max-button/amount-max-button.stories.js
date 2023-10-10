import React, { useEffect } from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import { select } from '@storybook/addon-knobs';
import sendSBReducer from '../../../../../../.storybook/reducers/sb-send-reducer';

import {
  updateAmountMode,
  updateSendStatus,
} from '../../../../../../.storybook/actions/sb-send-action';
import { AMOUNT_MODES, SEND_STATUSES } from '../../../../../ducks/send';
import AmountMaxButton from './amount-max-button';

export default {
  title: 'AmountMaxButton',
  id: __filename,
};

export const AmountMaxButtonComponent = () => {
  const store = createStore(sendSBReducer);
  const state = store.getState();
  const { send } = state;
  const isDraftTransactionInvalid =
    select('Is Draft Transaction Invalid', [
      SEND_STATUSES.INVALID,
      SEND_STATUSES.VALID,
    ]) || send.status;

  const maxModeOn =
    select('Max Mode On', [AMOUNT_MODES.MAX, AMOUNT_MODES.INPUT]) ||
    send.amount.mode;

  useEffect(() => {
    store.dispatch(updateSendStatus(isDraftTransactionInvalid));
  }, [isDraftTransactionInvalid, store]);

  useEffect(() => {
    store.dispatch(updateAmountMode(maxModeOn));
  }, [store, maxModeOn]);

  return (
    <Provider store={store}>
      <AmountMaxButton />
    </Provider>
  );
};
