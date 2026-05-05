import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DEFI_REFERRAL_PARTNERS } from '../../../../shared/constants/defi-referrals';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { DefiReferralConsent } from './defi-referral-consent';

const mockStore = configureMockStore([]);

// Get all partners as test cases
type PartnerTestCase = {
  partnerId: string;
  partnerName: string;
  learnMoreUrl: string;
  termsUrl: string;
};

const partnerTestCases: PartnerTestCase[] = Object.values(
  DEFI_REFERRAL_PARTNERS,
).map((partner) => ({
  partnerId: partner.id,
  partnerName: partner.name,
  learnMoreUrl: partner.learnMoreUrl,
  termsUrl: partner.termsUrl,
}));

describe('DefiReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each(partnerTestCases)(
    'with $partnerName',
    ({
      partnerId,
      partnerName,
      learnMoreUrl,
      termsUrl,
    }: PartnerTestCase) => {
      const props = {
        onActionComplete: jest.fn(),
        selectedAddress: '0x123',
        partnerId,
        partnerName,
        learnMoreUrl,
        termsUrl,
      };

      it('renders the component with correct title and subtitle', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        expect(
          screen.getByText(
            messages.defiReferralTitle.message.replace('$1', partnerName),
          ),
        ).toBeInTheDocument();
        expect(
          screen.getByText('MetaMask referral code', { exact: false }),
        ).toBeInTheDocument();
      });

      it('renders the correct partner image', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const image = screen.getByAltText(`${partnerName} referral`);
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute(
          'src',
          `./images/${partnerId}-referral.png`,
        );
      });

      it('renders the terms and learn more links with correct URLs', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const termsLink = screen.getByRole('link', { name: 'terms' });
        expect(termsLink).toHaveAttribute('href', termsUrl);
        expect(termsLink).toHaveAttribute('target', '_blank');
        expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');

        const learnMoreLink = screen.getByRole('link', {
          name: `${messages.learnMoreUpperCase.message}.`,
        });
        expect(learnMoreLink).toHaveAttribute('href', learnMoreUrl);
        expect(learnMoreLink).toHaveAttribute('target', '_blank');
        expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('renders the checkbox with default checked state', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

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

        const confirmButton = screen.getByRole('button', {
          name: messages.confirm.message,
        });
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

        const confirmButton = screen.getByRole('button', {
          name: messages.confirm.message,
        });
        fireEvent.click(confirmButton);

        expect(mockOnActionComplete).toHaveBeenCalledWith({
          approved: false,
          selectedAddress: '0x123',
        });
      });

      it('renders the checkbox label', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        expect(
          screen.getByText(messages.defiReferralCheckboxLabel.message),
        ).toBeInTheDocument();
      });
    },
  );
});
