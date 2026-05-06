import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DEFI_REFERRAL_PARTNERS } from '../../../../shared/constants/defi-referrals';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { useABTest } from '../../../hooks/useABTest';
import {
  DefiReferralUIABTestVariant,
  DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS,
} from '../../../../shared/lib/ab-testing/configs/defi-referral-ui';
import { DefiReferralConsent } from './defi-referral-consent';

jest.mock('../../../hooks/useABTest');

const mockStore = configureMockStore([]);
const mockUseABTest = jest.mocked(useABTest);

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
    mockUseABTest.mockReturnValue({
      variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.control,
      variantName: DefiReferralUIABTestVariant.Control,
      isActive: false,
    });
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

      it('renders control variant content with checkbox flow', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        expect(
          screen.getByText(
            messages.defiReferralTitle.message.replace('$1', partnerName),
          ),
        ).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(
          screen.getByRole('button', { name: messages.confirm.message }),
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

      it('renders control variant link with correct URL', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const learnMoreLink = screen.getByRole('link', {
          name: `${messages.learnMoreUpperCase.message}.`,
        });
        expect(learnMoreLink).toHaveAttribute('href', learnMoreUrl);
        expect(learnMoreLink).toHaveAttribute('target', '_blank');
        expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('submits approved false in control when checkbox is unchecked', () => {
        const store = mockStore(mockState);
        const mockOnActionComplete = jest.fn();

        renderWithProvider(
          <DefiReferralConsent
            {...props}
            onActionComplete={mockOnActionComplete}
          />,
          store,
        );

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(
          screen.getByRole('button', { name: messages.confirm.message }),
        );

        expect(mockOnActionComplete).toHaveBeenCalledWith({
          approved: false,
          selectedAddress: '0x123',
        });
      });

      it('renders treatment variant content with dual actions', () => {
        mockUseABTest.mockReturnValue({
          variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.treatment,
          variantName: DefiReferralUIABTestVariant.Treatment,
          isActive: true,
        });
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const titleKey = `${partnerId}ReferralTitle` as keyof typeof messages;
        const confirmKey =
          `${partnerId}ReferralConfirmText` as keyof typeof messages;
        expect(
          screen.getByText(messages[titleKey].message),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', {
            name: messages.defiReferralTerms.message,
          }),
        ).toHaveAttribute('href', learnMoreUrl);
        expect(
          screen.getByRole('button', { name: messages[confirmKey].message }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: messages.defiReferralNoThanks.message,
          }),
        ).toBeInTheDocument();
      });

      it('submits approved true in treatment when confirm is clicked', () => {
        mockUseABTest.mockReturnValue({
          variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.treatment,
          variantName: DefiReferralUIABTestVariant.Treatment,
          isActive: true,
        });
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

      it('submits approved false in treatment when no thanks is clicked', () => {
        mockUseABTest.mockReturnValue({
          variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.treatment,
          variantName: DefiReferralUIABTestVariant.Treatment,
          isActive: true,
        });
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
