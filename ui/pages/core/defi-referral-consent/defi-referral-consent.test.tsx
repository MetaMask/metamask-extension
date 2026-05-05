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
    ({ partnerId, partnerName, learnMoreUrl, termsUrl }: PartnerTestCase) => {
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

        const titleKey = `${partnerId}ReferralTitle` as keyof typeof messages;
        expect(
          screen.getByText(messages[titleKey].message),
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

        const links = screen.getAllByRole('link', {
          name: messages.learnMoreUpperCase.message,
        });
        expect(links).toHaveLength(2);

        const hrefs = links.map((link) => link.getAttribute('href'));
        expect(hrefs).toEqual(expect.arrayContaining([termsUrl, learnMoreUrl]));

        links.forEach((link) => {
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      });

      it('renders partner confirm and No thanks action buttons', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const confirmKey =
          `${partnerId}ReferralConfirmText` as keyof typeof messages;
        expect(
          screen.getByRole('button', { name: messages[confirmKey].message }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: messages.defiReferralNoThanks.message,
          }),
        ).toBeInTheDocument();
      });

      it('calls onActionComplete with approved=true when confirm is clicked', () => {
        const store = mockStore(mockState);
        const mockOnActionComplete = jest.fn();

        renderWithProvider(
          <DefiReferralConsent
            {...props}
            onActionComplete={mockOnActionComplete}
          />,
          store,
        );

        const confirmKey =
          `${partnerId}ReferralConfirmText` as keyof typeof messages;
        const confirmButton = screen.getByRole('button', {
          name: messages[confirmKey].message,
        });
        fireEvent.click(confirmButton);

        expect(mockOnActionComplete).toHaveBeenCalledWith({
          approved: true,
          selectedAddress: '0x123',
        });
      });

      it('calls onActionComplete with approved=false when cancel is clicked', () => {
        const store = mockStore(mockState);
        const mockOnActionComplete = jest.fn();

        renderWithProvider(
          <DefiReferralConsent
            {...props}
            onActionComplete={mockOnActionComplete}
          />,
          store,
        );

        const cancelButton = screen.getByRole('button', {
          name: messages.defiReferralNoThanks.message,
        });
        fireEvent.click(cancelButton);

        expect(mockOnActionComplete).toHaveBeenCalledWith({
          approved: false,
          selectedAddress: '0x123',
        });
      });
    },
  );
});
