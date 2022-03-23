import * as React from 'react';
import { render } from '@testing-library/react';
import TokenAggregators from './token-aggregators';

describe('TokenAggregators', () => {
  const args = {
    aggregatorsList: [
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
  it('should render the label', async () => {
    const { getByText } = render(<TokenAggregators {...args} />);
    expect(getByText('From Token List:')).toBeInTheDocument();
    expect(getByText('Aave, Bancor + 10 more')).toBeInTheDocument();
  });
});
