import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import {
  BalanceEmptyState,
  BalanceEmptyStateProps,
} from './balance-empty-state';


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
