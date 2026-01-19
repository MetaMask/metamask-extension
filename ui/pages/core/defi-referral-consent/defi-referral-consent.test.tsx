import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DefiReferralConsent } from './defi-referral-consent';

// Mock the i18n hook to return translation keys with interpolated values
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) => {
    const translations: Record<string, string> = {
      defiReferralTitle: `MetaMask x ${args?.[0] ?? ''}`,
      defiReferralSubtitle: 'Save on trades with a MetaMask referral code.',
      defiReferralCheckboxLabel:
        'Allow MetaMask to add a referral code. This is permanent.',
      learnMoreUpperCase: 'LEARN MORE',
      confirm: 'Confirm',
    };
    return translations[key] ?? key;
  },
}));

const defaultProps = {
  onActionComplete: jest.fn(),
  selectedAddress: '0x123',
  partnerId: 'hyperliquid',
  partnerName: 'Hyperliquid',
  learnMoreUrl: 'https://example.com/learn-more',
};

const mockStore = configureMockStore([]);

describe('DefiReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with correct title and subtitle', () => {
    const store = mockStore(mockState);

    renderWithProvider(<DefiReferralConsent {...defaultProps} />, store);

    // Title should include partner name (note: component has // todo comments that render as text)
    expect(screen.getByText(/MetaMask x Hyperliquid/u)).toBeInTheDocument();
    expect(
      screen.getByText('Save on trades with a MetaMask referral code.'),
    ).toBeInTheDocument();
  });

  it('renders the partner image with correct alt text', () => {
    const store = mockStore(mockState);

    renderWithProvider(<DefiReferralConsent {...defaultProps} />, store);

    const image = screen.getByAltText('Hyperliquid referral');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', './images/hyperliquid-referral.png');
  });

  it('renders the learn more link with correct URL', () => {
    const store = mockStore(mockState);

    renderWithProvider(<DefiReferralConsent {...defaultProps} />, store);

    const learnMoreLink = screen.getByRole('link');
    expect(learnMoreLink).toHaveAttribute(
      'href',
      'https://example.com/learn-more',
    );
    expect(learnMoreLink).toHaveAttribute('target', '_blank');
    expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the checkbox with default checked state', () => {
    const store = mockStore(mockState);

    renderWithProvider(<DefiReferralConsent {...defaultProps} />, store);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it('calls onActionComplete with approved=true when confirm is clicked and checkbox is checked', () => {
    const store = mockStore(mockState);
    const mockOnActionComplete = jest.fn();

    renderWithProvider(
      <DefiReferralConsent
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
      <DefiReferralConsent
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

  it('renders the checkbox label', () => {
    const store = mockStore(mockState);

    renderWithProvider(<DefiReferralConsent {...defaultProps} />, store);

    expect(
      screen.getByText(
        'Allow MetaMask to add a referral code. This is permanent.',
      ),
    ).toBeInTheDocument();
  });

  it('works with different partner configurations', () => {
    const store = mockStore(mockState);
    const asterDexProps = {
      ...defaultProps,
      partnerId: 'asterdex',
      partnerName: 'AsterDex',
      learnMoreUrl: 'https://asterdex.com/docs',
    };

    renderWithProvider(<DefiReferralConsent {...asterDexProps} />, store);

    // Should render with AsterDex info (using regex to match partial text)
    expect(screen.getByText(/MetaMask x AsterDex/u)).toBeInTheDocument();
    const image = screen.getByAltText('AsterDex referral');
    expect(image).toHaveAttribute('src', './images/asterdex-referral.png');
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://asterdex.com/docs',
    );
  });
});

// Previous tests from hyperliquid only consent UI

// import React from 'react';
// import { fireEvent, screen } from '@testing-library/react';
// import configureMockStore from 'redux-mock-store';
// import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
// import mockState from '../../../../test/data/mock-state.json';
// import { HyperliquidReferralConsent } from './hyperliquid-referral-consent';

// const defaultProps = {
//   onActionComplete: jest.fn(),
//   selectedAddress: '0x123',
// };

// const mockStore = configureMockStore([]);

// describe('HyperliquidReferralConsent', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('renders the component with correct title and subtitle', () => {
//     const store = mockStore(mockState);

//     renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

//     expect(screen.getByText('MetaMask x Hyperliquid')).toBeInTheDocument();
//     expect(
//       screen.getByText(
//         'Save up to 4% on trades with a MetaMask referral code.',
//       ),
//     ).toBeInTheDocument();
//   });

//   it('renders the checkbox with default checked state', () => {
//     const store = mockStore(mockState);

//     renderWithProvider(<HyperliquidReferralConsent {...defaultProps} />, store);

//     const checkbox = screen.getByRole('checkbox');
//     expect(checkbox).toBeInTheDocument();
//     expect(checkbox).toBeChecked();

//     expect(
//       screen.getByText(
//         'Allow MetaMask to add a referral code. This is permanent. The site offers discounts per their terms. MetaMask earns a fee.',
//       ),
//     ).toBeInTheDocument();
//   });

//   it('calls onActionComplete with approved=true when confirm is clicked and checkbox is checked', () => {
//     const store = mockStore(mockState);
//     const mockOnActionComplete = jest.fn();

//     renderWithProvider(
//       <HyperliquidReferralConsent
//         {...defaultProps}
//         onActionComplete={mockOnActionComplete}
//       />,
//       store,
//     );

//     const confirmButton = screen.getByRole('button', { name: 'Confirm' });
//     fireEvent.click(confirmButton);

//     expect(mockOnActionComplete).toHaveBeenCalledWith({
//       approved: true,
//       selectedAddress: '0x123',
//     });
//   });

//   it('calls onActionComplete with approved=false when confirm is clicked and checkbox is unchecked', () => {
//     const store = mockStore(mockState);
//     const mockOnActionComplete = jest.fn();

//     renderWithProvider(
//       <HyperliquidReferralConsent
//         {...defaultProps}
//         onActionComplete={mockOnActionComplete}
//       />,
//       store,
//     );

//     // Uncheck the checkbox first
//     const checkbox = screen.getByRole('checkbox');
//     fireEvent.click(checkbox);

//     const confirmButton = screen.getByRole('button', { name: 'Confirm' });
//     fireEvent.click(confirmButton);

//     expect(mockOnActionComplete).toHaveBeenCalledWith({
//       approved: false,
//       selectedAddress: '0x123',
//     });
//   });
// });
