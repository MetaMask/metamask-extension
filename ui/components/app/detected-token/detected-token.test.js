import * as React from 'react';
import { renderWithProvider, screen, fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import DetectedToken from './detected-token';

describe('DetectedToken', () => {
  it('should render the detected token found page', async () => {
    const store = configureStore({
      ...testData,
      metamask: {
        ...testData.metamask,
        currencyRates: {
          SepoliaETH: {
            conversionDate: 1620710825.03,
            conversionRate: 3910.28,
            usdConversionRate: 3910.28,
          },
        },
        ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        tokenBalances: {
          '0x514910771af9ca656af840dff83e8264ecf986ca': {
            [CHAIN_IDS.SEPOLIA]: {
              '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x25e4bc',
            },
          },
        },
        tokensChainsCache: {
          [CHAIN_IDS.SEPOLIA]: {
            data: {
              '0x514910771af9ca656af840dff83e8264ecf986ca': {
                address: '0x514910771af9ca656af840dff83e8264ecf986ca',
                symbol: 'LINK',
                decimals: 18,
                name: 'ChainLink Token',
                iconUrl:
                  'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
                aggregators: [
                  'Aave',
                  'Bancor',
                  'CMC',
                  'Crypto.com',
                  'CoinGecko',
                  '1inch',
                  'Paraswap',
                  'PMM',
                  'Zapper',
                  'Zerion',
                  '0x',
                ],
                occurrences: 12,
                unlisted: false,
              },
              '0xc00e94cb662c3520282e6f5717214004a7f26888': {
                address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
                symbol: 'COMP',
                decimals: 18,
                name: 'Compound',
                iconUrl:
                  'https://crypto.com/price/coin-data/icon/COMP/color_icon.png',
                aggregators: [
                  'Bancor',
                  'CMC',
                  'Crypto.com',
                  'CoinGecko',
                  '1inch',
                  'Paraswap',
                  'PMM',
                  'Zapper',
                  'Zerion',
                  '0x',
                ],
                occurrences: 12,
                unlisted: false,
              },
              '0xfffffffff15abf397da76f1dcc1a1604f45126db': {
                address: '0xfffffffff15abf397da76f1dcc1a1604f45126db',
                symbol: 'FSW',
                decimals: 18,
                name: 'Falconswap',
                iconUrl:
                  'https://assets.coingecko.com/coins/images/12256/thumb/falconswap.png?1598534184',
                aggregators: ['CoinGecko', '1inch', 'Lifi'],
                occurrences: 3,
                unlisted: false,
              },
            },
          },
        },
      },
    });
    const props = {
      setShowDetectedTokens: jest.fn(),
    };

    renderWithProvider(<DetectedToken {...props} />, store);

    expect(screen.getByText('0 LINK')).toBeInTheDocument();
    expect(screen.getByText('0 COMP')).toBeInTheDocument();
    expect(screen.getByText('0 FSW')).toBeInTheDocument();
    expect(screen.getAllByText('$0')).toHaveLength(3);
    expect(screen.getAllByText('Token address:')).toHaveLength(3);
    expect(screen.getByText('0x51491...986CA')).toBeInTheDocument();
    expect(screen.getByText('0xc00e9...26888')).toBeInTheDocument();
    expect(screen.getByText('0xfffff...126DB')).toBeInTheDocument();
    expect(screen.getAllByText('From token lists:')).toHaveLength(3);
    expect(screen.getByText('Aave, Bancor')).toBeInTheDocument();
    expect(screen.getByText('+ 9 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 9 more'));
    expect(
      screen.getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Bancor, CMC')).toBeInTheDocument();
    expect(screen.getByText('+ 8 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 8 more'));
    expect(
      screen.getByText(
        'Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('CoinGecko, 1inch')).toBeInTheDocument();
    expect(screen.getByText('+ 1 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 1 more'));
    expect(screen.getByText('CoinGecko, 1inch, Lifi.')).toBeInTheDocument();
  });
});
