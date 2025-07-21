import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../../test/lib/render-helpers';
import NativeValueDisplay from './native-value-display';

describe('NativeValueDisplay', () => {
  it('renders component correctly', async () => {
    const mockStore = configureMockStore([])(mockState);

    const { findByText } = renderWithProvider(
      <NativeValueDisplay value="4321" chainId="0x1" />,
      mockStore,
    );

    expect(await findByText('<0.000001')).toBeInTheDocument();
    expect(await findByText('ETH')).toBeInTheDocument();
  });
});
