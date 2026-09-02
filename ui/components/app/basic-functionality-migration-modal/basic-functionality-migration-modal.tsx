import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSocialLoginType } from '../../../selectors';
import { setPreference } from '../../../store/actions';
import { useAppSelector, useDispatch } from '../../../store/hooks';

export function BasicFunctionalityMigrationModal() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isOpen = useAppSelector(
    (state) =>
      Boolean(
        state.metamask.preferences
          ?.basicFunctionalityMigrationNotificationPending,
      ) && Boolean(getSocialLoginType(state)),
  );

  const close = () => {
    dispatch(
      setPreference(
        'basicFunctionalityMigrationNotificationPending',
        false,
        false,
      ),
    );
  };

  const openPrivacySettings = () => {
    close();
    navigate(PRIVACY_ROUTE);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      onClose={close}
      isOpen
      data-testid="basic-functionality-migration-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={close}>
          <Text variant={TextVariant.HeadingSm}>
            {t('basicFunctionalityMigrationModalTitle')}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('basicFunctionalityMigrationModalDescription')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={openPrivacySettings}
            data-testid="basic-functionality-migration-modal-open-settings"
          >
            {t('openSettings')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
