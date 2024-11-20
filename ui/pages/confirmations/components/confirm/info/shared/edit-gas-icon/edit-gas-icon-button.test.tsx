import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { EditGasIconButton } from './edit-gas-icon-button';

describe('<EditGasIconButton />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(
      <EditGasIconButton
        supportsEIP1559={true}
        setShowCustomizeGasPopover={() => console.log('open popover')}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
