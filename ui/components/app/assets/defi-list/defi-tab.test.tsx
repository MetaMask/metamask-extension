import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/jest';
import { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import useMultiPolling from '../../../../hooks/useMultiPolling';
import { getTokenSymbol } from '../../../../store/actions';
import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import { mockNetworkState } from '../../../../../test/stub/networks';
import DeFiTab from './defi-tab';

// Specific to just the ETH FIAT conversion
const CONVERSION_RATE = 1597.32;
const ETH_BALANCE = '0x041173b2c0e57d'; // 0.0011 ETH ($1.83)

const USDC_BALANCE = '199.4875'; // @ $1
const LINK_BALANCE = '122.0005'; // @ $6.75
const WBTC_BALANCE = '2.38'; // @ $26,601.51

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LINK_CONTRACT = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
const WBTC_CONTRACT = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const mockSelectedInternalAccount = getSelectedInternalAccountFromMockState(
  mockState as unknown as MetaMaskReduxState,
);

const render = (balance = ETH_BALANCE, chainId = CHAIN_IDS.MAINNET) => {
  const state = {
    ...mockState,
    metamask: {
      allDeFiPositions: {
        [mockSelectedInternalAccount.address]: {
          '0x1': {
            aggregatedMarketValue: 20540,
            protocols: {
              lido: {
                protocolDetails: {
                  name: 'Lido',
                  iconUrl:
                    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
                },
                aggregatedMarketValue: 20000,
                positionTypes: {
                  stake: {
                    aggregatedMarketValue: 20000,
                    positions: [
                      [
                        {
                          address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
                          name: 'Wrapped liquid staked Ether 2.0',
                          symbol: 'wstETH',
                          decimals: 18,
                          balanceRaw: '800000000000000000000',
                          balance: 800,
                          marketValue: 20000,
                          type: 'protocol',
                          tokens: [
                            {
                              address:
                                '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                              name: 'Liquid staked Ether 2.0',
                              symbol: 'stETH',
                              decimals: 18,
                              type: 'underlying',
                              balanceRaw: '1000000000000000000',
                              balance: 10,
                              price: 2000,
                              marketValue: 20000,
                              iconUrl:
                                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
                            },
                          ],
                        },
                      ],
                    ],
                  },
                },
              },
            },
          },
        },
      },
      ...mockState.metamask,
      ...mockNetworkState({ chainId }),
      currencyRates: {
        ETH: {
          conversionRate: CONVERSION_RATE,
        },
      },
    },
  };
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(<DeFiTab onClickAsset={() => undefined} />, store);
};

describe('DefiList', () => {
  it('renders AssetList component and shows AssetList control bar', async () => {
    await act(async () => {
      render();
    });

    console.log({ screen }, 'oioi');

    await waitFor(() => {
      // expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('import-token-button')).not.toBeInTheDocument();
    });
  });
});
