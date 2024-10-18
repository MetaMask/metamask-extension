import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import NFTSendHeading from './nft-send-heading';

describe('<NFTSendHeading />', () => {
  const middleware = [thunk];
  const state = getMockTokenTransferConfirmState({});
  const mockStore = configureMockStore(middleware)(state);

  it('renders component', () => {
    const { container } = renderWithConfirmContextProvider(
      <NFTSendHeading />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
