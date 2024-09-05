import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { GasFeesRow } from './gas-fees-row';

describe('<GasFeesRow />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <GasFeesRow
        label="Some kind of fee"
        tooltipText="Tooltip text"
        fiatFee="$1"
        nativeFee="0.0001 ETH"
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
