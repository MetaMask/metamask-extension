import React from 'react';
import { render, screen } from '@testing-library/react';
import type { Order, Position } from '../types';
import { PerpsMarketExpandedModals } from './perps-market-expanded-modals';

jest.mock('../../../../hooks/perps', () => ({
  usePerpsMarketInfo: () => ({ szDecimals: 4 }),
}));

jest.mock('../edit-margin', () => ({
  EditMarginModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-add-margin-modal" /> : null,
}));

jest.mock('../reverse-position', () => ({
  ReversePositionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-reverse-position-modal" /> : null,
}));

jest.mock('../update-tpsl', () => ({
  UpdateTPSLModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-update-tpsl-modal" /> : null,
}));

jest.mock('../close-position', () => ({
  ClosePositionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-close-position-modal" /> : null,
}));

jest.mock('../cancel-order', () => ({
  CancelOrderModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-cancel-order-modal" /> : null,
}));

jest.mock('../perps-geo-block-modal', () => ({
  PerpsGeoBlockModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-geo-block-modal" /> : null,
}));

const position = {
  symbol: 'BTC',
  entryPrice: '$44,000.00',
} as unknown as Position;

const order = {
  orderId: 'order-1',
  symbol: 'BTC',
} as unknown as Order;

const defaultProps = {
  account: null,
  selectedAddress: '0x123',
  currentPrice: 45000,
  decodedSymbol: 'BTC',
  markets: [],
  marginPositionTarget: null,
  reversePositionTarget: null,
  tpslPositionTarget: null,
  closePositionTarget: null,
  cancelOrderTarget: null,
  isGeoBlockModalOpen: false,
  onMarginPositionClose: jest.fn(),
  onReversePositionClose: jest.fn(),
  onTPSLPositionClose: jest.fn(),
  onClosePositionClose: jest.fn(),
  onCancelOrderClose: jest.fn(),
  onGeoBlockModalClose: jest.fn(),
};

describe('PerpsMarketExpandedModals', () => {
  it('renders the active position, order, and geo-block targets', () => {
    const { rerender } = render(
      <PerpsMarketExpandedModals
        {...defaultProps}
        tpslPositionTarget={position}
      />,
    );

    expect(screen.getByTestId('perps-update-tpsl-modal')).toBeInTheDocument();

    rerender(
      <PerpsMarketExpandedModals
        {...defaultProps}
        marginPositionTarget={position}
      />,
    );
    expect(screen.getByTestId('perps-add-margin-modal')).toBeInTheDocument();

    rerender(
      <PerpsMarketExpandedModals
        {...defaultProps}
        reversePositionTarget={position}
      />,
    );
    expect(
      screen.getByTestId('perps-reverse-position-modal'),
    ).toBeInTheDocument();

    rerender(
      <PerpsMarketExpandedModals
        {...defaultProps}
        closePositionTarget={position}
      />,
    );
    expect(
      screen.getByTestId('perps-close-position-modal'),
    ).toBeInTheDocument();

    rerender(
      <PerpsMarketExpandedModals {...defaultProps} cancelOrderTarget={order} />,
    );
    expect(screen.getByTestId('perps-cancel-order-modal')).toBeInTheDocument();

    rerender(
      <PerpsMarketExpandedModals {...defaultProps} isGeoBlockModalOpen />,
    );
    expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
  });
});
