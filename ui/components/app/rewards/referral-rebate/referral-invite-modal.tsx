import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type ReferralInviteModalProps = {
  isOpen: boolean;
  referralCode: string;
  onAccept: () => void;
  onClose: () => void;
  onContinueWithoutReferral: () => void;
};

/**
 * Invite sheet for a fee-rebate referral. Accept continues into the
 * confirmation modal; dismissing leaves the referral unapplied.
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the invite modal is visible
 * @param options0.referralCode - Code shown to the invited person
 * @param options0.onAccept - Called when the person accepts the offer
 * @param options0.onClose - Called when the modal is dismissed
 * @param options0.onContinueWithoutReferral - Called when the person skips
 */
export const ReferralInviteModal = ({
  isOpen,
  referralCode,
  onAccept,
  onClose,
  onContinueWithoutReferral,
}: ReferralInviteModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="referral-rebate-invite-modal"
    >
      <ModalOverlay />
      <ModalContent className="items-center" size={ModalContentSize.Md}>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            ariaLabel: t('close'),
            'data-testid': 'referral-rebate-invite-close',
          }}
        >
          {t('referralRebateInviteTitle')}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('referralRebateInviteDescription')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Label
                htmlFor="referral-rebate-code"
                color={TextColor.TextAlternative}
              >
                {t('referralRebateInviteCodeLabel')}
              </Label>
              <TextField
                id="referral-rebate-code"
                value={referralCode}
                isReadOnly
                size={TextFieldSize.Lg}
                className="h-14 w-full"
                inputProps={{ className: 'px-4 font-medium' }}
                data-testid="referral-rebate-invite-code"
              />
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={2}
            className="w-full"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onAccept}
              data-testid="referral-rebate-invite-accept"
            >
              {t('referralRebateInviteAccept')}
            </Button>
            <Button
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={onContinueWithoutReferral}
              className="text-default"
              data-testid="referral-rebate-invite-skip"
            >
              {t('referralRebateInviteSkip')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
