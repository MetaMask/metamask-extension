import * as React from 'react';
import {
  renderWithProvider,
  screen,
  fireEvent,
} from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import DetectedTokenAggregators from './detected-token-aggregators';

describe('DetectedTokenAggregators', () => {
  const args = {
    aggregators: [
      'Aave',
      'Bancor',
      'CMC',
      'Crypto.com',
      'CoinGecko',
      '1inch',
      'Paraswap',
      'PMM',
      'Synthetix',
      'Zapper',
      'Zerion',
      '0x',
    ],
  };

  it('should render the detected token aggregators', async () => {
    const store = configureStore({});
    renderWithProvider(<DetectedTokenAggregators {...args} />, store);

    expect(screen.getByText('From token lists:')).toBeInTheDocument();
    expect(screen.getByText('Aave, Bancor')).toBeInTheDocument();
    expect(screen.getByText('+ 10 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 10 more'));
    expect(
      screen.getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Synthetix, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
  });
});
