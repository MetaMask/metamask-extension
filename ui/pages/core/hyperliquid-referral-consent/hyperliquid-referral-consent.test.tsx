import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { HyperliquidReferralConsent } from './hyperliquid-referral-consent';

const defaultProps = {
  onActionComplete: jest.fn(),
  selectedAddress: '0x123',
};

const mockStore = configureMockStore([]);

describe('HyperliquidReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with correct title and subtitle', () => {
    const store = mockStore(mockState);

    renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

    expect(screen.getByText('MetaMask x Hyperliquid')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Save up to 4% on trades with a MetaMask referral code.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the checkbox with default checked state', () => {
    const store = mockStore(mockState);

    renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    expect(
      screen.getByText(
        'Allow MetaMask to add a referral code. This is permanent. The site offers discounts per their terms. MetaMask earns a fee.',
      ),
    ).toBeInTheDocument();
  });

  it('calls onActionComplete with approved=true when confirm is clicked and checkbox is checked', () => {
    const store = mockStore(mockState);
    const mockOnActionComplete = jest.fn();

    renderWithProvider(
      <HyperliquidReferralConsent
        {...defaultProps}
        onActionComplete={mockOnActionComplete}
      />,
      store,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    expect(mockOnActionComplete).toHaveBeenCalledWith({
      approved: true,
      selectedAddress: '0x123',
    });
  });

  it('calls onActionComplete with approved=false when confirm is clicked and checkbox is unchecked', () => {
    const store = mockStore(mockState);
    const mockOnActionComplete = jest.fn();

    renderWithProvider(
      <HyperliquidReferralConsent
        {...defaultProps}
        onActionComplete={mockOnActionComplete}
      />,
      store,
    );

    // Uncheck the checkbox first
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    expect(mockOnActionComplete).toHaveBeenCalledWith({
      approved: false,
      selectedAddress: '0x123',
    });
  });
});
