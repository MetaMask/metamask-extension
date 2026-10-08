import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../../../shared/constants/preferences';
import type { ReferralMeDto } from '../../../../../shared/types/rewards-money';
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
 * Shown after a referee registers. Copy and the hero image come from the
 * refreshed referral-me payload. Both actions leave the modal.
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
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            ariaLabel: copy?.inviteAcceptedCloseA11y ?? '',
          }}
        >
          {copy?.inviteAcceptedEyebrow ?? ''}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            {imageUrl ? (
              <img
                alt=""
                data-testid="money-referral-activated-hero"
                src={imageUrl}
              />
            ) : null}
            <Text variant={TextVariant.headingMd}>
              {copy?.inviteAcceptedTitle ?? ''}
            </Text>
            <Text>{body}</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
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
