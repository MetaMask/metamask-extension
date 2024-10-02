import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import SendHeading from './send-heading';

describe('<SendHeading />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<SendHeading />, mockStore);

    expect(container).toMatchSnapshot();
  });
});
