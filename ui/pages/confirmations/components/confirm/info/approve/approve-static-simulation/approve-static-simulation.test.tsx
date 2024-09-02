import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { ApproveStaticSimulation } from './approve-static-simulation';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';

describe('<ApproveStaticSimulation />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedApproveConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <ApproveStaticSimulation />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
