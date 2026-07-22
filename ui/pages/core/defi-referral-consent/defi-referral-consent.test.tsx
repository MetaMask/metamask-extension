import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../../shared/constants/defi-referrals';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { useABTest } from '../../../hooks/useABTest';
import { DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS } from '../../../../shared/lib/ab-testing/configs/defi-referral-ui';
import { ABTestVariant } from '../../../../shared/lib/ab-testing/variants';
import { DefiReferralConsent } from './defi-referral-consent';

jest.mock('../../../hooks/useABTest');

const mockStore = configureMockStore([]);
const mockUseABTest = jest.mocked(useABTest);

const mockControlVariant = () =>
  mockUseABTest.mockReturnValue({
    variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.control,
    variantName: ABTestVariant.Control,
    isActive: false,
  });

const mockTreatmentVariant = () =>
  mockUseABTest.mockReturnValue({
    variant: DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS.treatment,
    variantName: ABTestVariant.Treatment,
    isActive: true,
  });

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

const hyperliquidPartner =
  DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid];

const nonHyperliquidPartners = partnerTestCases.filter(
  ({ partnerId }) => partnerId !== DefiReferralPartner.Hyperliquid,
);

describe('DefiReferralConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockControlVariant();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each(partnerTestCases)(
    'control variant with $partnerName',
    ({ partnerId, partnerName, learnMoreUrl }: PartnerTestCase) => {
      const props = {
        onActionComplete: jest.fn(),
        selectedAddress: '0x123',
        partnerId,
        partnerName,
        learnMoreUrl,
      };

      it('renders the control title, checkbox and confirm button', () => {
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

      it('renders the learn more link with correct URL', () => {
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        const learnMoreLink = screen.getByRole('link', {
          name: `${messages.learnMoreUpperCase.message}.`,
        });
        expect(learnMoreLink).toHaveAttribute('href', learnMoreUrl);
        expect(learnMoreLink).toHaveAttribute('target', '_blank');
        expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('submits approved=false when the checkbox is unchecked', () => {
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
    },
  );

  describe('treatment variant for Hyperliquid', () => {
    const props = {
      onActionComplete: jest.fn(),
      selectedAddress: '0x123',
      partnerId: hyperliquidPartner.id,
      partnerName: hyperliquidPartner.name,
      learnMoreUrl: hyperliquidPartner.learnMoreUrl,
    };

    beforeEach(() => {
      mockTreatmentVariant();
    });

    it('renders the redesigned title, checkbox, terms link and confirm button', () => {
      const store = mockStore(mockState);

      renderWithProvider(<DefiReferralConsent {...props} />, store);

      expect(
        screen.getByText(messages.hyperliquidReferralTitle.message),
      ).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
      expect(
        screen.getByRole('link', { name: messages.defiReferralTerms.message }),
      ).toHaveAttribute('href', hyperliquidPartner.learnMoreUrl);
      expect(
        screen.getByRole('button', { name: messages.confirm.message }),
      ).toBeInTheDocument();
    });

    it('submits approved=true when confirm is clicked and checkbox is checked', () => {
      const store = mockStore(mockState);
      const mockOnActionComplete = jest.fn();

      renderWithProvider(
        <DefiReferralConsent
          {...props}
          onActionComplete={mockOnActionComplete}
        />,
        store,
      );

      fireEvent.click(
        screen.getByRole('button', { name: messages.confirm.message }),
      );

      expect(mockOnActionComplete).toHaveBeenCalledWith({
        approved: true,
        selectedAddress: '0x123',
      });
    });

    it('submits approved=false when confirm is clicked and checkbox is unchecked', () => {
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
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each(nonHyperliquidPartners)(
    'non-Hyperliquid partner $partnerName ignores the treatment variant',
    ({ partnerId, partnerName, learnMoreUrl }: PartnerTestCase) => {
      const props = {
        onActionComplete: jest.fn(),
        selectedAddress: '0x123',
        partnerId,
        partnerName,
        learnMoreUrl,
      };

      it('always renders the control variant', () => {
        mockTreatmentVariant();
        const store = mockStore(mockState);

        renderWithProvider(<DefiReferralConsent {...props} />, store);

        expect(
          screen.getByText(
            messages.defiReferralTitle.message.replace('$1', partnerName),
          ),
        ).toBeInTheDocument();
        expect(
          screen.queryByText(messages.hyperliquidReferralTitle.message),
        ).not.toBeInTheDocument();
      });
    },
  );
});
