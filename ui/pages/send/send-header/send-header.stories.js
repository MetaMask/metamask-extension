import React, { useEffect } from 'react';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';

import { select } from '@storybook/addon-knobs';
import {
  updateSendStage,
  updateSendAsset,
} from '../../../../.storybook/actions/sb-send-action';

import sendSBReducer from '../../../../.storybook/reducers/sb-send-reducer';
import historySBReducer from '../../../../.storybook/reducers/sb-history-reducer';

import { ASSET_TYPES, SEND_STAGES } from '../../../ducks/send';
import SendHeader from './send-header.component';

export default {
  title: 'SendHeader',
  id: __filename,
};

export const SendHeaderComponent = () => {
  const store = createStore(
    combineReducers({ send: sendSBReducer, history: historySBReducer }),
  );
  const state = store.getState();
  const { send } = state;
  const asset =
    select('Asset', [ASSET_TYPES.NATIVE, ASSET_TYPES.TOKEN]) || send.asset;

  const stage =
    select('Stage', [
      SEND_STAGES.ADD_RECIPIENT,
      SEND_STAGES.DRAFT,
      SEND_STAGES.EDIT,
      SEND_STAGES.INACTIVE,
    ]) || send.stage;

  useEffect(() => {
    store.dispatch(updateSendAsset(asset));
  }, [store, asset]);

  useEffect(() => {
    store.dispatch(updateSendStage(stage));
  }, [store, stage]);

  return (
    <Provider store={store}>
      <div style={{ width: 600 }}>
        <SendHeader />
      </div>
    </Provider>
  );
};
