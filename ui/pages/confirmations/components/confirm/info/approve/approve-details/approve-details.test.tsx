import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { ApproveDetails } from './approve-details';

describe('<ApproveDetails />', () => {
  const middleware = [thunk];

  it('renders component for approve details', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<ApproveDetails />, mockStore);

    expect(container).toMatchSnapshot();
  });
});
