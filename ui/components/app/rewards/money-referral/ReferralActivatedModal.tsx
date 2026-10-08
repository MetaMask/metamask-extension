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
import { ThemeType } from '../../../../../shared/constants/preferences';
import type { ReferralMeDto } from '../../../../../shared/types/rewards-money';
import {
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useTheme } from '../../../../hooks/useTheme';

/**
 * `{date}` is the full trailing time phrase so both forms stay grammatical:
 * `through <formatted cashback_earning_end>` or `for a limited time`.
 *
 * @param template - Server copy that may contain `{date}`.
 * @param earningEnd - `referred_by.cashback_earning_end`.
 * @param formatDate - Formats a valid end date for the current locale.
 * @returns The body with `{date}` replaced.
 */
function fillInviteAcceptedBodyDate(
  template: string,
  earningEnd: string | null | undefined,
  formatDate: (date: Date) => string = (date) =>
    date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
): string {
  if (!template.includes('{date}')) {
    return template;
  }
  let datePhrase = 'for a limited time';
  if (earningEnd) {
    const parsed = new Date(earningEnd);
    if (!Number.isNaN(parsed.getTime())) {
      datePhrase = `through ${formatDate(parsed)}`;
    }
  }
  return template.replaceAll('{date}', datePhrase);
}

type ReferralActivatedModalProps = {
  referralMe: ReferralMeDto | null;
  onClose: () => void;
};

/**
 * Shown after a referee registers. Uses the perps tour modal chrome from the
 * referral rebate confirmation, with copy and the hero from referral me.
 *
 * @param props - The settled payload, which may be missing after a failed read-back.
 * @param props.referralMe - Referral me after register, or null.
 * @param props.onClose - Closes the modal.
 */
export function ReferralActivatedModal({
  referralMe,
  onClose,
}: ReferralActivatedModalProps) {
  const theme = useTheme();
  const copy = referralMe?.localized_text;
  const hero = referralMe?.invite_hero;
  const imageUrl =
    theme === ThemeType.dark ? hero?.darkModeUrl : hero?.lightModeUrl;
  const body = fillInviteAcceptedBodyDate(
    copy?.inviteAcceptedBody ?? '',
    referralMe?.referred_by?.cashback_earning_end,
  );

  return (
    <Modal isOpen onClose={onClose} data-testid="money-referral-activated">
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        size={ModalContentSize.Md}
        modalDialogProps={{
          paddingTop: 0,
          paddingBottom: 0,
          style: {
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          closeButtonProps={{
            ariaLabel: copy?.inviteAcceptedCloseA11y ?? '',
            className: 'absolute z-10',
            style: {
              top: '24px',
              right: '12px',
            },
          }}
          paddingBottom={0}
          onClose={onClose}
        />
        <ModalBody className="w-full h-full pt-6 pb-4 flex flex-col">
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            className="px-6 pt-4"
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.SuccessDefault}
              fontWeight={FontWeight.Medium}
              textTransform={TextTransform.Uppercase}
              textAlign={TextAlign.Center}
            >
              {copy?.inviteAcceptedEyebrow ?? ''}
            </Text>
            <Text
              variant={TextVariant.HeadingLg}
              textAlign={TextAlign.Center}
              className="mt-3"
            >
              {copy?.inviteAcceptedTitle ?? ''}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
              className="mt-2"
            >
              {body}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              className="my-6 w-full"
            >
              {imageUrl ? (
                <img
                  alt=""
                  data-testid="money-referral-activated-hero"
                  src={imageUrl}
                  className="h-[220px] w-full object-contain"
                />
              ) : null}
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
              onClick={onClose}
              data-testid="money-referral-activated-start"
            >
              {copy?.inviteAcceptedStartTrading ?? ''}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
