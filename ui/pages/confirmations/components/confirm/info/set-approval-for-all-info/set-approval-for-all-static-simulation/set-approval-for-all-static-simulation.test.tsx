import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockSetApprovalForAllConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { SetApprovalForAllStaticSimulation } from './set-approval-for-all-static-simulation';

describe('<SetApprovalForAllStaticSimulation />', () => {
  const middleware = [thunk];

  it('renders component for approve request', async () => {
    const state = getMockSetApprovalForAllConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <SetApprovalForAllStaticSimulation />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
