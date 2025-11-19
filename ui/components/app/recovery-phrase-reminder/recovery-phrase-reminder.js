import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useI18nContext } from '../../../hooks/useI18nContext';
// Helpers
import {
  TextAlign,
  TextVariant,
  AlignItems,
  IconColor,
  Display,
  FlexDirection,
  BlockSize,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_REVEAL_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonPrimary,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
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
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            gap={4}
          >
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.warningDefault}
            />
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('recoveryPhraseReminderTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <img
              src="images/forgot-password-lock.png"
              width={154}
              height={154}
              alt={t('recoveryPhraseReminderTitle')}
              style={{
                alignSelf: 'center',
              }}
            />
          </Box>
          <Text>{t('recoveryPhraseReminderSubText')}</Text>
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
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
