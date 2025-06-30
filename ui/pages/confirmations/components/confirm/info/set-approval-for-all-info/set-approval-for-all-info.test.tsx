import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  getMockConfirmState,
  getMockSetApprovalForAllConfirmState,
} from '../../../../../../../test/data/confirmations/helper';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import SetApprovalForAllInfo from './set-approval-for-all-info';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<SetApprovalForAllInfo />', () => {
  const middleware = [thunk];

  it('renders component for approve request', async () => {
    const state = getMockSetApprovalForAllConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <SetApprovalForAllInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('does not render component when no transaction is in state', async () => {
    const state = getMockConfirmState({
      metamask: {
        ...mockState.metamask,
        pendingApprovals: {},
        transactions: [],
      },
    });

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <SetApprovalForAllInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
