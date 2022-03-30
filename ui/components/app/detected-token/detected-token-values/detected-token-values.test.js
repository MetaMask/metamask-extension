import * as React from 'react';
import { renderWithProvider, screen } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import DetectedTokenValues from './detected-token-values';

describe('DetectedTokenValues', () => {
  const args = {
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    symbol: 'SNX',
    decimals: 18,
    iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
    aggregators: [
      'aave',
      'bancor',
      'cmc',
      'cryptocom',
      'coinGecko',
      'oneInch',
      'paraswap',
      'pmm',
      'synthetix',
      'zapper',
      'zerion',
      'zeroEx',
    ],
  };

  it('should render the detected token address', async () => {
    const store = configureStore(testData);
    renderWithProvider(<DetectedTokenValues token={args} />, store);

    expect(screen.getByText('0 SNX')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});
