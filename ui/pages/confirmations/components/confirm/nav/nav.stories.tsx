import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import Nav from './nav';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
    pendingApprovals: {
      testApprovalId: {
        id: 'testApprovalId',
        time: 1528133319641,
        origin: 'metamask',
        type: 'personal_sign',
        requestData: {
          txId: 'testTransactionId',
        },
        requestState: {
          test: 'value',
        },
      },
      testApprovalId2: {
        id: 'testApprovalId2',
        time: 1528133319641,
        origin: 'metamask',
        type: 'personal_sign',
        requestData: {
          txId: 'testTransactionId',
        },
        requestState: {
          test: 'value',
        },
      },
      testApprovalId3: {
        id: 'testApprovalId3',
        time: 1528133319649,
        origin: 'metamask',
        type: 'personal_sign',
        requestData: {
          txId: 'testTransactionId',
        },
        requestState: {
          test: 'value',
        },
      },
    },
  },
  confirm: {
    currentConfirmation: {
      id: 'testApprovalId2',
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      },
    },
  },
});

const Story = {
  title: 'Components/App/Confirm/Nav',
  component: Nav,
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export default Story;

export const DefaultStory = () => <Nav />;

DefaultStory.storyName = 'Default';
