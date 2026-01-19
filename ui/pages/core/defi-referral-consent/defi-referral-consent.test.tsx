import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DEFI_REFERRAL_PARTNERS } from '../../../../shared/constants/defi-referrals';
import { DefiReferralConsent } from './defi-referral-consent';

const mockStore = configureMockStore([]);

// Get all partners as test cases
type PartnerTestCase = {
  partnerId: string;
  partnerName: string;
  learnMoreUrl: string;
};

const partnerTestCases: PartnerTestCase[] = Object.values(
  DEFI_REFERRAL_PARTNERS,
).map((partner) => ({
  partnerId: partner.id,
  partnerName: partner.name,
  learnMoreUrl: partner.learnMoreUrl,
}));

describe('DefiReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each(partnerTestCases)(
    'with $partnerName',
    ({ partnerId, partnerName, learnMoreUrl }: PartnerTestCase) => {
      const props = {
        onActionComplete: jest.fn(),
        selectedAddress: '0x123',
        partnerId,
        partnerName,
        learnMoreUrl,
      };

      it('renders the component with correct title and subtitle', () => {
        const store = mockStore(mockState);

        renderWithProvider(
          <DefiReferralConsent {...props} />,
          store,
        );

        expect(
          screen.getByText(`MetaMask x ${partnerName}`),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Save up to 4% on trades with a MetaMask referral code.'),
        ).toBeInTheDocument();
      });

      it('renders the partner image with correct alt text', () => {
        const store = mockStore(mockState);

        renderWithProvider(
          <DefiReferralConsent {...props} />,
          store,
        );

        const image = screen.getByAltText(`${partnerName} referral`);
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute(
          'src',
          `./images/${partnerId}-referral.png`,
        );
      });

      it('renders the learn more link with correct URL', () => {
        const store = mockStore(mockState);

        renderWithProvider(
          <DefiReferralConsent {...props} />,
          store,
        );

        const learnMoreLink = screen.getByRole('link');
        expect(learnMoreLink).toHaveAttribute('href', learnMoreUrl);
        expect(learnMoreLink).toHaveAttribute('target', '_blank');
        expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('renders the checkbox with default checked state', () => {
        const store = mockStore(mockState);

        renderWithProvider(
          <DefiReferralConsent {...props} />,
          store,
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toBeChecked();
      });

      it('calls onActionComplete with approved=true when confirm is clicked and checkbox is checked', () => {
        const store = mockStore(mockState);
        const mockOnActionComplete = jest.fn();

        renderWithProvider(
          <DefiReferralConsent
            {...props}
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
            {...props}
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

        renderWithProvider(
          <DefiReferralConsent {...props} />,
          store,
        );

        expect(
          screen.getByText(
            'Allow MetaMask to add a referral code. This is permanent. The site offers discounts per their terms. MetaMask earns a fee.',
          ),
        ).toBeInTheDocument();
      });
    },
  );
});
