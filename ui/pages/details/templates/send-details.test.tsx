import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { SendDetails } from './send-details';

jest.mock('../components/sections', () => ({
  TokensSection: ({ chainId }: { chainId?: string }) => (
    <div data-testid="tokens-section">{chainId}</div>
  ),
  MetadataSection: () => <div data-testid="metadata-section" />,
}));

jest.mock('../components/amounts-section', () => ({
  FeesRows: () => <div data-testid="fees-rows" />,
  TotalAmountRow: () => <div data-testid="total-amount-row" />,
}));

jest.mock('../components/block-explorer-button', () => ({
  BlockExplorerButton: () => <div data-testid="block-explorer-button" />,
}));

const item = {
  type: 'send',
  chainId: 'eip155:88888',
  status: 'success',
  timestamp: 1,
  hash: '0xabc',
  data: { from: '0x1', to: '0x2' },
} as Extract<ActivityListItem, { type: 'send' | 'receive' }>;

describe('SendDetails', () => {
  it("passes the activity's own chainId to TokensSection", () => {
    render(<SendDetails item={item} />);

    expect(screen.getByTestId('tokens-section')).toHaveTextContent(
      'eip155:88888',
    );
  });
});
