import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { RampTokensSection } from './ramp-tokens-section';

jest.mock('../../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: () => <div data-testid="activity-avatar" />,
}));

jest.mock('../../components/sections', () => ({
  TokensSection: ({
    tokens,
  }: {
    tokens: { token?: { symbol?: string; amount?: string } }[];
  }) => <div data-testid="tokens-section">{tokens[0]?.token?.symbol}</div>,
}));

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

const buildItem = (overrides: Partial<RampOrderItem> = {}): RampOrderItem =>
  ({
    type: 'rampBuy',
    chainId: 'eip155:1',
    status: 'pending',
    timestamp: 1,
    data: {
      token: {
        direction: 'in',
        symbol: 'ETH',
        assetId: 'eip155:1/slip44:60',
      },
    },
    ...overrides,
  }) as RampOrderItem;

describe('RampTokensSection', () => {
  it('renders a pending ellipsis label when crypto amount is unknown', () => {
    const { getByTestId } = render(<RampTokensSection item={buildItem()} />);

    expect(getByTestId('activity-avatar')).toBeInTheDocument();
    expect(
      getByTestId('transaction-list-item-primary-currency'),
    ).toHaveTextContent('... ETH');
  });

  it('delegates to TokensSection when an amount is available', () => {
    const { getByTestId, queryByTestId } = render(
      <RampTokensSection
        item={buildItem({
          status: 'success',
          data: {
            token: {
              direction: 'in',
              symbol: 'ETH',
              amount: '1.5',
              assetId: 'eip155:1/slip44:60',
            },
          },
        })}
      />,
    );

    expect(getByTestId('tokens-section')).toHaveTextContent('ETH');
    expect(queryByTestId('activity-avatar')).not.toBeInTheDocument();
  });
});
