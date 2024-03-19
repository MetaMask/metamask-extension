import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setDisableExternalServices } from '../../../store/actions';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  ModalFooter,
  Button,
  IconName,
  ButtonVariant,
  Icon,
  IconSize,
  Checkbox,
} from '../../component-library';
import { getDisableExternalServices } from '../../../selectors';
import {
  hideBasicFunctionalityModal,
  onboardingToggleBasicFunctionalityOff,
} from '../../../ducks/app/app';
import { ONBOARDING_PRIVACY_SETTINGS_ROUTE } from '../../../helpers/constants/routes';

export function BasicConfigurationModal() {
  const t = useI18nContext();
  const [hasAgreed, setHasAgreed] = useState(false);
  const dispatch = useDispatch();
  const isBasicConfigurationSettingOff = useSelector(
    getDisableExternalServices,
  );
  const { pathname } = useLocation();
  const onboardingFlow = pathname === ONBOARDING_PRIVACY_SETTINGS_ROUTE;
  function disableExternalServices() {
    dispatch(setDisableExternalServices(true));
  }
  function enableExternalServices() {
    dispatch(setDisableExternalServices(false));
  }

  function closeModal() {
    dispatch(hideBasicFunctionalityModal());
  }

  return (
    <Modal
      onClose={closeModal}
      data-testid="dapp-permission-modal"
      isOpen={true}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          paddingBottom={4}
          paddingRight={4}
          paddingLeft={4}
          onClose={closeModal}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
          >
            <Icon
              size={IconSize.Xl}
              name={IconName.Danger}
              color={IconColor.errorDefault}
            />
            <Text variant={TextVariant.headingSm}>
              {isBasicConfigurationSettingOff
                ? t('basicConfigurationModalHeadingOn')
                : t('basicConfigurationModalHeadingOff')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          marginLeft={4}
          marginRight={4}
          marginBottom={4}
          display={Display.Flex}
          gap={4}
          flexDirection={FlexDirection.Column}
        >
          <Text variant={TextVariant.bodySm}>
            {isBasicConfigurationSettingOff
              ? t('basicConfigurationModalDisclaimerOn')
              : t('basicConfigurationModalDisclaimerOff')}
          </Text>
          {!isBasicConfigurationSettingOff && (
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <Checkbox
                isChecked={hasAgreed}
                onClick={() => {
                  setHasAgreed((prevValue) => !prevValue);
                }}
              />{' '}
              <Text variant={TextVariant.bodySm}>
                {t('basicConfigurationModalCheckbox')}
              </Text>
            </Box>
          )}
        </Box>

        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              onClick={() => {
                closeModal();
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={!hasAgreed && !isBasicConfigurationSettingOff}
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              onClick={() => {
                if (onboardingFlow) {
                  dispatch(hideBasicFunctionalityModal());
                  dispatch(onboardingToggleBasicFunctionalityOff());
                } else {
                  closeModal();
                  isBasicConfigurationSettingOff
                    ? enableExternalServices()
                    : disableExternalServices();
                }
              }}
              danger
            >
              {isBasicConfigurationSettingOff ? t('turnOn') : t('turnOff')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
