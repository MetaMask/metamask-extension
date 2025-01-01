import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { GasFeesRow } from './gas-fees-row';

describe('<GasFeesRow />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <GasFeesRow
        label="Some kind of fee"
        tooltipText="Tooltip text"
        fiatFee="$1"
        fiatFeeWith18SignificantDigits="0.001234"
        nativeFee="0.0001 ETH"
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
