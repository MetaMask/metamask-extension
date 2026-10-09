import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextTransform,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PerpsTutorialModal from '../../perps/perps-tutorial-modal/PerpsTutorialModal';

const OFFER_DURATION_DAYS = 30;

/**
 * Offer end date shown on the confirmation, 30 days after the screen is viewed.
 *
 * @param from - The day the screen is viewed
 * @returns A short localized date, such as "Nov 5, 2026"
 */
export function getRebateOfferEndLabel(from = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + OFFER_DURATION_DAYS);
  return end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export type ReferralActivatedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStartTrading: () => void;
};

/**
 * Confirmation that the referral rebate is active. Rendered inside the perps
 * tour modal so the celebration uses that same full-height modal.
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the confirmation is visible
 * @param options0.onClose - Called when the modal is dismissed
 * @param options0.onStartTrading - Called when the person starts trading
 */
export const ReferralActivatedModal = ({
  isOpen,
  onClose,
  onStartTrading,
}: ReferralActivatedModalProps) => {
  const t = useI18nContext();

  return (
    <PerpsTutorialModal
      isOpen={isOpen}
      onClose={onClose}
      testId="referral-rebate-activated-modal"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        className="px-6 pt-4"
        data-testid="referral-rebate-activated-content"
      >
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.SuccessDefault}
          fontWeight={FontWeight.Medium}
          textTransform={TextTransform.Uppercase}
          textAlign={TextAlign.Center}
        >
          {t('referralRebateActivatedEyebrow')}
        </Text>
        <Text
          variant={TextVariant.HeadingLg}
          textAlign={TextAlign.Center}
          className="mt-3"
        >
          {t('referralRebateActivatedTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
          className="mt-2"
        >
          {t('referralRebateActivatedDescription', [getRebateOfferEndLabel()])}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="my-6 w-full"
          data-testid="referral-rebate-activated-art"
        >
          <img
            src="./images/referral-rebate-activated.png"
            alt=""
            className="h-[220px] w-full object-contain"
          />
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        className="w-full px-4"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={onStartTrading}
          data-testid="referral-rebate-activated-start-trading"
        >
          {t('referralRebateActivatedStartTrading')}
        </Button>
      </Box>
    </PerpsTutorialModal>
  );
};
