import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/token-approve';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { ApproveDetails } from './approve-details';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: () => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    }),
  }),
);

describe('<ApproveDetails />', () => {
  const middleware = [thunk];

  it('renders component for approve details', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedApproveConfirmation(),
    );
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for approve details for setApprovalForAll', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedApproveConfirmation(),
    );
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveDetails isSetApprovalForAll />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
