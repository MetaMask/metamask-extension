import React, { useEffect } from 'react';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';

import {
  updateSendStage,
  updateSendAsset,
} from '../../../../.storybook/actions/sb-send-action';

import sendSBReducer from '../../../../.storybook/reducers/sb-send-reducer';
import historySBReducer from '../../../../.storybook/reducers/sb-history-reducer';
import SendHeader from './send-header.component';

export default {
  title: 'Pages/Send/SendHeader',

  argTypes: {
    asset: {
      control: {
        type: 'select',
      },
      options: ['NATIVE', 'TOKEN'],
    },
    stage: {
      control: {
        type: 'select',
      },
      options: ['ADD_RECIPIENT', 'DRAFT', 'EDIT', 'INACTIVE'],
    },
  },
};

const store = createStore(
  combineReducers({ send: sendSBReducer, history: historySBReducer }),
);
const state = store.getState();
const { send } = state;

export const DefaultStory = (args) => {
  useEffect(() => {
    store.dispatch(updateSendAsset(args.asset));
  }, [args.asset]);

  useEffect(() => {
    store.dispatch(updateSendStage(args.stage));
  }, [args.stage]);

  return (
    <Provider store={store}>
      <div style={{ width: 600 }}>
        <SendHeader {...args} />
      </div>
    </Provider>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  asset: 'NATIVE' || send.asset,
  stage: 'ADD_RECIPIENT' || send.stage,
};
