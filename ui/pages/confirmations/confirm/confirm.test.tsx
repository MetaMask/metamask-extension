import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { unapprovedPersonalMsg } from '../../../../test/data/confirmations/personal_sign';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import Confirm from './confirm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: jest.fn(),
  }),
}));

const middleware = [thunk];

describe('Confirm', () => {
  it('should render', () => {
    const mockStore = configureMockStore(middleware)(mockState);
    const { container } = renderWithProvider(<Confirm />, mockStore);
    expect(container).toBeDefined();
  });

  it('should match snapshot for personal signature', async () => {
    const mockStatePersonalSign = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
      },
      confirm: { currentConfirmation: unapprovedPersonalMsg },
    };
    const mockStore = configureMockStore(middleware)(mockStatePersonalSign);
    const { container } = renderWithProvider(<Confirm />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
