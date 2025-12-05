import * as React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';

import DetectedTokenAddress from './detected-token-address';

describe('DetectedTokenAddress', () => {
  const args = {
    tokenAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  };

  it('should render the detected token address', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(
      <DetectedTokenAddress {...args} />,
      store,
    );

    expect(getByText('Token address:')).toBeInTheDocument();
    expect(getByText('0xc011a...f2a6f')).toBeInTheDocument();
  });
});
