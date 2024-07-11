import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { EditGasFeesRow } from './edit-gas-fees-row';

describe('<EditGasFeesRow />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = { ...mockState, confirm: { currentConfirmation: null } };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <EditGasFeesRow
        fiatFee="$1"
        nativeFee="0.001 ETH"
        supportsEIP1559={true}
        setShowCustomizeGasPopover={() => console.log('open popover')}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
