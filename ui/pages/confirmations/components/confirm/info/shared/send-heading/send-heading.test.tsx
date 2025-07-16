import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import SendHeading from './send-heading';

describe('<SendHeading />', () => {
  const middleware = [thunk];
  const state = getMockTokenTransferConfirmState({});
  const mockStore = configureMockStore(middleware)(state);

  it('renders component', () => {
    const { container } = renderWithConfirmContextProvider(
      <SendHeading />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
