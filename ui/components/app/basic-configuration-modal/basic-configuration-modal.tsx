import React, { useMemo, useState } from 'react';
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
  FontWeight,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { toggleExternalServices } from '../../../store/actions';
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
  ButtonSize,
  Label,
} from '../../component-library';
import { getUseExternalServices } from '../../../selectors';
import {
  hideBasicFunctionalityModal,
  onboardingToggleBasicFunctionalityOff,
} from '../../../ducks/app/app';
import { ONBOARDING_PRIVACY_SETTINGS_ROUTE } from '../../../helpers/constants/routes';

export function BasicConfigurationModal() {
  const t = useI18nContext();
  const [hasAgreed, setHasAgreed] = useState(false);
  const dispatch = useDispatch();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const { pathname } = useLocation();
  const onboardingFlow = useMemo(() => {
    return pathname === ONBOARDING_PRIVACY_SETTINGS_ROUTE;
  }, [pathname]);

  function closeModal() {
    dispatch(hideBasicFunctionalityModal());
  }

  return (
    <Modal onClose={closeModal} data-testid="dapp-permission-modal" isOpen>
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
              {isExternalServicesEnabled
                ? t('basicConfigurationModalHeadingOff')
                : t('basicConfigurationModalHeadingOn')}
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
            {isExternalServicesEnabled
              ? t('basicConfigurationModalDisclaimerOff')
              : t('basicConfigurationModalDisclaimerOn')}
          </Text>
          {isExternalServicesEnabled && (
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <Checkbox
                id="basic-configuration-checkbox"
                isChecked={hasAgreed}
                onClick={() => setHasAgreed((prevValue) => !prevValue)}
              />
              <Label
                htmlFor="basic-configuration-checkbox"
                fontWeight={FontWeight.Normal}
                variant={TextVariant.bodySm}
              >
                {t('basicConfigurationModalCheckbox')}
              </Label>
            </Box>
          )}
        </Box>

        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              onClick={closeModal}
            >
              {t('cancel')}
            </Button>
            <Button
              size={ButtonSize.Lg}
              disabled={!hasAgreed && isExternalServicesEnabled}
              width={BlockSize.Half}
              variant={ButtonVariant.Primary}
              onClick={() => {
                if (onboardingFlow) {
                  dispatch(hideBasicFunctionalityModal());
                  dispatch(onboardingToggleBasicFunctionalityOff());
                } else {
                  closeModal();
                  dispatch(toggleExternalServices(!isExternalServicesEnabled));
                }
              }}
              danger={isExternalServicesEnabled}
            >
              {isExternalServicesEnabled ? t('turnOff') : t('turnOn')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
