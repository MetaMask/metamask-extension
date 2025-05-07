import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockSetApprovalForAllConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { ConfirmLoader } from './confirm-loader';

describe('<ConfirmLoader />', () => {
  const middleware = [thunk];

  it('renders component', async () => {
    const state = getMockSetApprovalForAllConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <ConfirmLoader />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
