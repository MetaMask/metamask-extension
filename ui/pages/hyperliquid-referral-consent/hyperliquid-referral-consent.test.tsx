import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { HyperliquidReferralConsent } from './hyperliquid-referral-consent';

const defaultProps = {
  onActionComplete: jest.fn(),
  allAccounts: true,
  selectedAddress: '0x123',
};

const mockStore = configureMockStore([]);

describe('HyperliquidReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with correct title and subtitle', () => {
    const store = mockStore(mockState);

    renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

    expect(screen.getByText('metaMaskXHyperliquid')).toBeInTheDocument();
    expect(
      screen.getByText('saveOnTradesWithAMetaMaskReferralCode'),
    ).toBeInTheDocument();
  });

  it('should render checkbox with default checked state', () => {
    const store = mockStore(mockState);

    renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    expect(
      screen.getByText('allowMetaMaskToAddAReferralCode'),
    ).toBeInTheDocument();
  });

  it('should call onActionComplete with approved=true when confirm is clicked and checkbox is checked', () => {
    const store = mockStore(mockState);
    const mockOnActionComplete = jest.fn();

    renderWithProvider(
      <HyperliquidReferralConsent
        {...defaultProps}
        onActionComplete={mockOnActionComplete}
      />,
      store,
    );

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    fireEvent.click(confirmButton);

    expect(mockOnActionComplete).toHaveBeenCalledWith({
      approved: true,
      allAccounts: true,
      selectedAddress: '0x123456789abcdef',
    });
  });

  it('should call onActionComplete with approved=false when confirm is clicked and checkbox is unchecked', () => {
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

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    fireEvent.click(confirmButton);

    expect(mockOnActionComplete).toHaveBeenCalledWith({
      approved: false,
      allAccounts: true,
      selectedAddress: '0x123456789abcdef',
    });
  });
});
