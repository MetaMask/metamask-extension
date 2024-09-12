import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { ApproveDetails } from './approve-details';

describe('<ApproveDetails />', () => {
  const middleware = [thunk];

  it('renders component for approve details', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
