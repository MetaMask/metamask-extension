import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
// Helpers
import {
  AlignItems,
  TextAlign,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_REVEAL_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  ButtonLink,
  ButtonLinkSize,
  ButtonPrimary,
  ButtonSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';

export default function RecoveryPhraseReminder({ onConfirm }) {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleBackUp = () => {
    const backUpSRPRoute = `${ONBOARDING_REVEAL_SRP_ROUTE}/?isFromReminder=true`;
    navigate(backUpSRPRoute);
  };

  return (
    <Modal isOpen onClose={() => undefined}>
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onConfirm}>
          <Box
            className="flex flex-col"
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('recoveryPhraseReminderTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Box
            className="flex w-full"
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            marginBottom={4}
          >
            <img
              src="images/forgot-password-lock.png"
              width={100}
              height={100}
              alt={t('recoveryPhraseReminderTitle')}
            />
          </Box>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('recoveryPhraseReminderSubText')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box className="flex flex-col" gap={2}>
            <ButtonPrimary size={ButtonSize.Lg} block onClick={handleBackUp}>
              {t('recoveryPhraseReminderBackupStart')}
            </ButtonPrimary>
            <ButtonLink size={ButtonLinkSize.Lg} block onClick={onConfirm}>
              {t('recoveryPhraseReminderConfirm')}
            </ButtonLink>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

RecoveryPhraseReminder.propTypes = {
  onConfirm: PropTypes.func.isRequired,
};
