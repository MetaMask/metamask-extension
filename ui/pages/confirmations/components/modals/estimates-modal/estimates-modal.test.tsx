import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { EstimatesModal } from './estimates-modal';

jest.mock('../../../hooks/gas/useGasOptions', () => ({
  useGasOptions: () => ({
    options: [
      {
        emoji: '🐢',
        estimatedTime: '30 sec',
        isSelected: false,
        key: 'low',
        name: 'Low',
        onSelect: jest.fn(),
        value: '0.0001 ETH',
        valueInFiat: '$0.10',
      },
      {
        emoji: '🦊',
        estimatedTime: '15 sec',
        isSelected: true,
        key: 'medium',
        name: 'Market',
        onSelect: jest.fn(),
        value: '0.0002 ETH',
        valueInFiat: '$0.20',
      },
      {
        emoji: '🚀',
        estimatedTime: '5 sec',
        isSelected: false,
        key: 'high',
        name: 'Aggressive',
        onSelect: jest.fn(),
        value: '0.0003 ETH',
        valueInFiat: '$0.30',
      },
    ],
  }),
}));

jest.mock(
  '../../edit-gas-fee-popover/network-statistics/network-statistics',
  () => () => <div data-testid="network-statistics">Network Statistics</div>,
);

describe('EstimatesModal', () => {
  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header and gas options', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <EstimatesModal
        setActiveModal={mockSetActiveModal}
        handleCloseModals={mockHandleCloseModals}
      />,
    );

    expect(getByText('Edit gas fee')).toBeInTheDocument();
    expect(getByTestId('gas-option-low')).toBeInTheDocument();
    expect(getByTestId('gas-option-medium')).toBeInTheDocument();
    expect(getByTestId('gas-option-high')).toBeInTheDocument();
  });

  it('renders network statistics', () => {
    const { getByTestId } = renderWithProvider(
      <EstimatesModal
        setActiveModal={mockSetActiveModal}
        handleCloseModals={mockHandleCloseModals}
      />,
    );

    expect(getByTestId('network-statistics')).toBeInTheDocument();
  });

  it('renders learn more link', () => {
    const { getByText } = renderWithProvider(
      <EstimatesModal
        setActiveModal={mockSetActiveModal}
        handleCloseModals={mockHandleCloseModals}
      />,
    );

    expect(getByText('learn more')).toBeInTheDocument();
  });
});
