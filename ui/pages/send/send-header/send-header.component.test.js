import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { fireEvent } from '@testing-library/react';
import { SEND_STAGES } from '../../../ducks/send';
import { renderWithProvider } from '../../../../test/jest';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  getInitialSendStateWithExistingTxState,
  INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
} from '../../../../test/jest/mocks';
import SendHeader from './send-header.component';

const middleware = [thunk];

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

describe('SendHeader Component', () => {
  describe('Title', () => {
    it('should render "Send to" for INACTIVE or ADD_RECIPIENT stages', () => {
      const { getByText, rerender } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send to')).toBeTruthy();
      rerender(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            stage: SEND_STAGES.ADD_RECIPIENT,
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send to')).toBeTruthy();
    });

    it('should render "Send" for DRAFT stage when asset type is NATIVE', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            stage: SEND_STAGES.DRAFT,
            asset: {
              ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT.asset,
              type: AssetType.native,
            },
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send')).toBeTruthy();
    });

    it('should render "Send Tokens" for DRAFT stage when asset type is TOKEN', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...getInitialSendStateWithExistingTxState({
              asset: {
                type: AssetType.token,
              },
            }),
            stage: SEND_STAGES.DRAFT,
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Send tokens')).toBeTruthy();
    });

    it('should render "Edit" for EDIT stage', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            stage: SEND_STAGES.EDIT,
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Edit')).toBeTruthy();
    });
  });

  describe('Cancel Button', () => {
    it('has a cancel button in header', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('has button label changed to Cancel edit in editing stage', () => {
      const { getByText } = renderWithProvider(
        <SendHeader />,
        configureMockStore(middleware)({
          send: {
            ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
            stage: SEND_STAGES.EDIT,
          },
          gas: { basicEstimateStatus: 'LOADING' },
          history: { mostRecentOverviewPage: 'activity' },
        }),
      );
      expect(getByText('Cancel edit')).toBeTruthy();
    });

    it('resets send state when clicked', () => {
      const store = configureMockStore(middleware)({
        send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
        gas: { basicEstimateStatus: 'LOADING' },
        history: { mostRecentOverviewPage: 'activity' },
      });
      const { getByText } = renderWithProvider(<SendHeader />, store);
      const expectedActions = [
        { type: 'send/resetSendState', payload: undefined },
      ];
      fireEvent.click(getByText('Cancel'));
      expect(store.getActions()).toStrictEqual(expectedActions);
    });
  });
});
