import * as React from 'react';
import { renderWithProvider, screen } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import DetectedTokenValues from './detected-token-values';

describe('DetectedTokenValues', () => {
  const args = {
    tokenAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  };

  it('should render the detected token address', async () => {
    const store = configureStore(testData);
    renderWithProvider(<DetectedTokenValues {...args} />, store);

    expect(screen.getByText('0 SNX')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});
