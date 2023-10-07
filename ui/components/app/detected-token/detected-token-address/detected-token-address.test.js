import * as React from 'react';
import { renderWithProvider, screen } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import DetectedTokenAddress from './detected-token-address';

describe('DetectedTokenAddress', () => {
  const args = {
    tokenAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  };

  it('should render the detected token address', async () => {
    const store = configureStore({});
    renderWithProvider(<DetectedTokenAddress {...args} />, store);

    expect(screen.getByText('Token address:')).toBeInTheDocument();
    expect(screen.getByText('0xc011a...f2a6f')).toBeInTheDocument();
  });
});
