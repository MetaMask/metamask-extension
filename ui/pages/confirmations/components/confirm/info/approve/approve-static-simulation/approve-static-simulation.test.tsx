import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { ApproveStaticSimulation } from './approve-static-simulation';

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
    const { container } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
