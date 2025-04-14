// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import SendHeading from './send-heading';

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

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
