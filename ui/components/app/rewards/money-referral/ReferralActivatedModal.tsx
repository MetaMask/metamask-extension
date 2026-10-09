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
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
  TextColor,
  TextTransform,
  TextVariant,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../../../shared/constants/preferences';
import type { ReferralMeDto } from '../../../../../shared/types/rewards-money';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTheme } from '../../../../hooks/useTheme';

/**
 * Formats `referred_by.cashback_earning_end` for the current locale.
 *
 * @param earningEnd - ISO end timestamp, or missing.
 * @param formatDate - Formats a valid end date for the current locale.
 * @returns The locale date, or null when the timestamp is missing or invalid.
 */
function formatCashbackEarningEnd(
  earningEnd: string | null | undefined,
  formatDate: (date: Date) => string,
): string | null {
  if (!earningEnd) {
    return null;
  }
  const parsed = new Date(earningEnd);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return formatDate(parsed);
}

/**
 * Activated body copy. A usable end date fills `{date}` in the localized
 * `inviteAcceptedBody` as `through <locale date>`. Without a date, the whole
 * body is `fallback` so we do not inject English.
 *
 * @param acceptedBody - `localized_text.inviteAcceptedBody`.
 * @param fallback - Copy used when the end date is missing or invalid.
 * @param earningEnd - `referred_by.cashback_earning_end`.
 * @param formatDate - Formats a valid end date for the current locale.
 * @returns The body to show.
 */
function resolveActivatedBody(
  acceptedBody: string | undefined,
  fallback: string | undefined,
  earningEnd: string | null | undefined,
  formatDate: (date: Date) => string = (date) =>
    date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
): string {
  const formattedEnd = formatCashbackEarningEnd(earningEnd, formatDate);
  if (!formattedEnd) {
    return fallback ?? '';
  }
  const template = acceptedBody ?? '';
  if (!template.includes('{date}')) {
    return template;
  }
  return template.replaceAll('{date}', `through ${formattedEnd}`);
}

type ReferralActivatedModalProps = {
  referralMe: ReferralMeDto | null;
  onClose: () => void;
};

/**
 * Shown after a referee registers.
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
  const t = useI18nContext();
  const titleId = React.useId();
  const startButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useLayoutEffect(() => {
    // The invite dialog unmounts in the same commit, which drops focus to the
    // page. Move it onto the primary action once this dialog is in the DOM.
    startButtonRef.current?.focus();
  }, []);
  const copy = referralMe?.localized_text;
  const hero = referralMe?.invite_hero;
  const imageUrl =
    theme === ThemeType.dark ? hero?.darkModeUrl : hero?.lightModeUrl;
  const body = resolveActivatedBody(
    copy?.inviteAcceptedBody,
    copy?.inviteMessageBody,
    referralMe?.referred_by?.cashback_earning_end,
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      initialFocusRef={startButtonRef}
      data-testid="money-referral-activated"
    >
      <ModalOverlay />
      <ModalContent
        className="items-center"
        size={ModalContentSize.Md}
        modalDialogProps={{ 'aria-labelledby': titleId }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            ariaLabel: copy?.inviteAcceptedCloseA11y || t('close'),
          }}
        />
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
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
              asChild
              variant={TextVariant.HeadingLg}
              textAlign={TextAlign.Center}
              className="mt-3"
            >
              <h2 id={titleId}>{copy?.inviteAcceptedTitle ?? ''}</h2>
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
        </ModalBody>
        <ModalFooter>
          <Button
            ref={startButtonRef}
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={onClose}
            data-testid="money-referral-activated-start"
          >
            {copy?.inviteAcceptedStartTrading ?? ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
