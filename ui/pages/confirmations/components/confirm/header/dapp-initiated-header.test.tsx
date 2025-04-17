// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { DefaultRootState } from 'react-redux';
import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import { DAppInitiatedHeader } from './dapp-initiated-header';

const render = (
  state: DefaultRootState = getMockTokenTransferConfirmState({}),
) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<DAppInitiatedHeader />, store);
};

describe('<DAppInitiatedHeader />', () => {
  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });
});
