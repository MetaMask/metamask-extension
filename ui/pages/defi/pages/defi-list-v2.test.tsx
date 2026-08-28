import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import type { CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import DefiListV2 from './defi-list-v2';

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value),
  }),
}));

jest.mock('../../../components/ui/virtualized-list/virtualized-list', () => ({
  VirtualizedList: ({
    data,
    renderItem,
    keyExtractor,
    listEmptyComponent,
  }: {
    data: unknown[];
    renderItem: (info: { item: unknown }) => React.ReactNode;
    keyExtractor: (item: unknown) => string;
    listEmptyComponent?: React.ReactNode;
  }) => {
    if (data.length === 0) {
      return <>{listEmptyComponent}</>;
    }

    return (
      <div>
        {data.map((item) => (
          <div key={keyExtractor(item)}>{renderItem({ item })}</div>
        ))}
      </div>
    );
  },
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addCategory: jest.fn().mockReturnThis(),
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(() => ({})),
    })),
  }),
}));

const lidoPosition: DeFiProtocolPositionGroup = {
  protocolId: 'lido',
  productName: 'Lido',
  protocolIconUrl: 'lido.png',
  chainId: 'eip155:1' as CaipChainId,
  marketValue: 20000,
  iconGroup: [{ symbol: 'stETH', avatarValue: 'steth.png' }],
  sections: [],
};

const aavePosition: DeFiProtocolPositionGroup = {
  protocolId: 'aave',
  productName: 'Aave',
  protocolIconUrl: 'aave.png',
  chainId: 'eip155:137' as CaipChainId,
  marketValue: 500,
  iconGroup: [{ symbol: 'USDC', avatarValue: 'usdc.png' }],
  sections: [],
};

const render = ({
  positions = [lidoPosition],
  isLoading = false,
  isError = false,
  onClick = jest.fn(),
  enabledNetworks = { eip155: { '0x1': true } },
}: {
  positions?: DeFiProtocolPositionGroup[];
  isLoading?: boolean;
  isError?: boolean;
  onClick?: (chainId: string, protocolId: string) => void;
  enabledNetworks?: Record<string, Record<string, boolean>>;
} = {}) => {
  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      enabledNetworkMap: enabledNetworks,
    },
  });

  return renderWithProvider(
    <DefiListV2
      onClick={onClick}
      positions={positions}
      isLoading={isLoading}
      isError={isError}
    />,
    store,
  );
};

describe('DefiListV2', () => {
  it('renders loading spinner while positions are loading', () => {
    render({ isLoading: true });

    expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();
  });

  it('renders error message when positions fail to load and none are cached', () => {
    render({ isError: true, positions: [] });

    expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
      messages.defiTabErrorTitle.message,
    );
    expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
      messages.defiTabErrorContent.message,
    );
  });

  it('keeps rendering cached rows when a background refresh fails', () => {
    render({ isError: true, positions: [lidoPosition] });

    expect(screen.getByText('lido')).toBeInTheDocument();
    expect(
      screen.queryByTestId('defi-tab-error-message'),
    ).not.toBeInTheDocument();
  });

  it('renders empty state when there are no positions', () => {
    render({ positions: [] });

    expect(screen.getByTestId('defi-tab-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText(messages.defiEmptyDescription.message),
    ).toBeInTheDocument();
  });

  it('renders protocol rows for enabled networks', () => {
    render({
      positions: [lidoPosition, aavePosition],
      enabledNetworks: { eip155: { '0x1': true } },
    });

    expect(screen.getByText('lido')).toBeInTheDocument();
    expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
      '$20,000.00',
    );
    expect(screen.queryByText('aave')).not.toBeInTheDocument();
  });

  it('calls onClick with chain and protocol ids when a row is clicked', () => {
    const onClick = jest.fn();

    render({ onClick });

    fireEvent.click(screen.getByTestId('multichain-token-list-button'));

    expect(onClick).toHaveBeenCalledWith('eip155:1', 'lido');
  });
});
