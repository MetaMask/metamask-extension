import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import type { DeFiProtocolListItem } from '../components/defi-protocol-cell-v2';
import type { DeFiListItemsV2 } from '../hooks/useDeFiListItemsV2';
import DefiListV2 from './defi-list-v2';

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

const lidoItem: DeFiProtocolListItem = {
  protocolId: 'lido',
  chainId: 'eip155:1' as CaipChainId,
  tokenImage: 'lido.png',
  marketValue: '$20,000.00',
  tokenFiatAmount: 20000,
  iconGroup: [{ symbol: 'stETH', avatarValue: 'steth.png' }],
  underlyingSymbols: ['stETH'],
};

const render = (
  options: {
    items?: DeFiListItemsV2;
    onClick?: (chainId: string, protocolId: string) => void;
  } = {},
) => {
  const items = 'items' in options ? options.items : [lidoItem];
  const onClick = options.onClick ?? jest.fn();
  const store = configureMockStore([thunk])(mockState);

  return renderWithProvider(
    <DefiListV2 items={items} onClick={onClick} />,
    store,
  );
};

describe('DefiListV2', () => {
  it('renders loading spinner while positions are loading', () => {
    render({ items: undefined });

    expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();
  });

  it('renders error message when positions fail to load', () => {
    render({ items: null });

    expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
      messages.defiTabErrorTitle.message,
    );
    expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
      messages.defiTabErrorContent.message,
    );
  });

  it('renders empty state when there are no positions', () => {
    render({ items: [] });

    expect(screen.getByTestId('defi-tab-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText(messages.defiEmptyDescription.message),
    ).toBeInTheDocument();
  });

  it('renders protocol rows', () => {
    render();

    expect(screen.getByText('lido')).toBeInTheDocument();
    expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
      '$20,000.00',
    );
  });

  it('calls onClick with chain and protocol ids when a row is clicked', () => {
    const onClick = jest.fn();

    render({ onClick });

    fireEvent.click(screen.getByTestId('multichain-token-list-button'));

    expect(onClick).toHaveBeenCalledWith('eip155:1', 'lido');
  });
});
