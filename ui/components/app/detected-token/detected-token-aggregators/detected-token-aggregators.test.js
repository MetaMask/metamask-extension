import * as React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { fireEvent } from '../../../../../test/jest';
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
    const { getByText } = renderWithProvider(
      <DetectedTokenAggregators {...args} />,
      store,
    );

    expect(getByText('From token lists:')).toBeInTheDocument();
    expect(getByText('Aave, Bancor')).toBeInTheDocument();
    expect(getByText('+ 10 more')).toBeInTheDocument();
    fireEvent.click(getByText('+ 10 more'));
    expect(
      getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Synthetix, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
  });
});
