import React from 'react';
import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import { DAppInitiatedHeader } from './dapp-initiated-header';

const render = (state = getMockTokenTransferConfirmState({})) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<DAppInitiatedHeader />, store);
};

describe('<DAppInitiatedHeader />', () => {
  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });
});
