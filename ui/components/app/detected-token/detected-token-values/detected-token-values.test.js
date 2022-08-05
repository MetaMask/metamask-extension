import * as React from 'react';
import { renderWithProvider, screen } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import DetectedTokenValues from './detected-token-values';

describe('DetectedTokenValues', () => {
  const args = {
    token: {
      address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      symbol: 'SNX',
      decimals: 18,
      iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
      aggregators: [
        'Aave',
        'Bancor',
        'CMC',
        'Crypto.com',
        'CoinGecko',
        '1Inch',
        'Paraswap',
        'PMM',
        'Synthetix',
        'Zapper',
        'Zerion',
        '0x',
      ],
    },
    handleTokenSelection: jest.fn(),
    tokensListDetected: {
      '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
        token: {
          name: 'Synthetix Network',
          address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
          symbol: 'SNX',
          decimals: 18,
          iconUrl:
            'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
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
        },
        selected: true,
      },
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        token: {
          name: 'ChainLink Token',
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          iconUrl:
            'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
          aggregators: ['coinGecko', 'oneInch', 'paraswap', 'zapper', 'zerion'],
        },
        selected: true,
      },
    },
  };

  it('should render the detected token address', async () => {
    const store = configureStore(testData);
    renderWithProvider(<DetectedTokenValues {...args} />, store);

    expect(screen.getByText('0 SNX')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});
