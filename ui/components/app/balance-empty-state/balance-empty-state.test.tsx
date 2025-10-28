import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import {
  BalanceEmptyState,
  BalanceEmptyStateProps,
} from './balance-empty-state';

// Mock FundingMethodModal component
jest.mock('../../multichain/funding-method-modal/funding-method-modal', () => ({
  FundingMethodModal: ({
    isOpen,
    onClose,
    onClickReceive,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onClickReceive: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="funding-method-modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="modal-receive" onClick={onClickReceive}>
          Receive
        </button>
      </div>
    ) : null,
}));

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const renderComponent = (props: Partial<BalanceEmptyStateProps> = {}) => {
  return renderWithProvider(<BalanceEmptyState {...props} />, store);
};

describe('BalanceEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with all expected elements', () => {
    renderComponent();

    // Check for the main elements
    expect(screen.getByText('Fund your wallet')).toBeInTheDocument();
    expect(
      screen.getByText('Get your wallet ready to use web3.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add funds/iu }),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Fund your wallet')).toBeInTheDocument();
  });

  it('should open modal when "Add funds" button is clicked', () => {
    renderComponent();

    const addFundsButton = screen.getByRole('button', { name: /add funds/iu });
    fireEvent.click(addFundsButton);

    expect(screen.getByTestId('funding-method-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add funds');
  });

  it('should close modal when close button in modal is clicked', () => {
    renderComponent();

    // Open modal
    const addFundsButton = screen.getByRole('button', { name: /add funds/iu });
    fireEvent.click(addFundsButton);

    expect(screen.getByTestId('funding-method-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);

    expect(
      screen.queryByTestId('funding-method-modal'),
    ).not.toBeInTheDocument();
  });

  it('should call onClickReceive when receive button in modal is clicked', () => {
    const mockOnClickReceive = jest.fn();
    renderComponent({ onClickReceive: mockOnClickReceive });

    // Open modal
    const addFundsButton = screen.getByRole('button', { name: /add funds/iu });
    fireEvent.click(addFundsButton);

    // Click receive in modal
    const receiveButton = screen.getByTestId('modal-receive');
    fireEvent.click(receiveButton);

    expect(mockOnClickReceive).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId('funding-method-modal'),
    ).not.toBeInTheDocument();
  });

  it('should handle missing onClickReceive gracefully', () => {
    renderComponent(); // No onClickReceive prop

    // Open modal
    const addFundsButton = screen.getByRole('button', { name: /add funds/iu });
    fireEvent.click(addFundsButton);

    // Click receive in modal - should not throw error
    const receiveButton = screen.getByTestId('modal-receive');
    expect(() => fireEvent.click(receiveButton)).not.toThrow();

    // Modal should still close
    expect(
      screen.queryByTestId('funding-method-modal'),
    ).not.toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const customClass = 'custom-balance-empty-state';
    const { container } = renderComponent({ className: customClass });

    const component = container.firstChild as HTMLElement;
    expect(component).toHaveClass(customClass);
  });

  it('should apply custom testID when provided', () => {
    const testId = 'custom-test-id';
    renderComponent({ testID: testId });

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
