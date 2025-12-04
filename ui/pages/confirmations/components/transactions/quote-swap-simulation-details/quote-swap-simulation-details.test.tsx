import React from 'react';
import configureMockStore from 'redux-mock-store';
import { QuoteResponse } from '@metamask/bridge-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { QuoteSwapSimulationDetails } from './quote-swap-simulation-details';

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertActionClicked: jest.fn(),
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
    })),
  }),
);

const quote = {
  quote: {
    srcAsset: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      chainId: 8453,
      assetId: 'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      decimals: 6,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/erc20/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png',
      metadata: { storage: { balance: 9, approval: 10 } },
    },
    srcTokenAmount: '99125',
    destAsset: {
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      chainId: 8453,
      assetId: 'eip155:8453/erc20:0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
      symbol: 'USDT',
      decimals: 6,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/erc20/0xfde4c96c8593536e31f229ea8f37b2ada2699bb2.png',
      metadata: { storage: { balance: 0, approval: 1 } },
    },
    destTokenAmount: '99132',
    minDestTokenAmount: '97149',
  },
};

function render(args: Record<string, string> = {}) {
  const state = getMockConfirmStateForTransaction({
    ...mockSwapConfirmation,
    ...args,
  } as Confirmation);

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <QuoteSwapSimulationDetails
      fiatRates={{
        '0x0000000000000000000000000000000000000000': 3377.19,
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 0.999877,
        '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': 0.999578,
      }}
      quote={quote as unknown as QuoteResponse}
      sourceTokenAmount={'0x186a0'}
      tokenDetails={{
        '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': {
          decimals: '6',
          symbol: 'USDT',
          standard: 'ERC20',
        },
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
          decimals: '6',
          symbol: 'USDC',
          standard: 'ERC20',
        },
      }}
      tokenAmountDifference={0.25}
    />,
    mockStore,
  );
}

describe('<QuoteSwapSimulationDetails />', () => {
  it('renders component without errors', () => {
    const { getByText } = render();
    expect(getByText('Best quote')).toBeInTheDocument();
    expect(getByText('You send')).toBeInTheDocument();
    expect(getByText('You receive')).toBeInTheDocument();
    expect(getByText('- 0.1')).toBeInTheDocument();
    expect(getByText('+ 0.0991')).toBeInTheDocument();
    expect(getByText('Get $0.25 more')).toBeInTheDocument();
  });
});
