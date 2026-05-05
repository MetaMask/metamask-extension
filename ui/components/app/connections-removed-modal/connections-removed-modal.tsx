import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Button,
  Icon,
  IconSize,
  IconName,
  ModalFooter,
  ModalBody,
  ButtonSize,
} from '../../component-library';
import { resetWallet } from '../../../store/actions';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConnectionsRemovedModal() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleConfirm = async () => {
    await dispatch(resetWallet());

    const envType = getEnvironmentType();
    if (
      envType === ENVIRONMENT_TYPE_POPUP ||
      envType === ENVIRONMENT_TYPE_SIDEPANEL
    ) {
      global.platform.openExtensionInBrowser?.(DEFAULT_ROUTE);
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="connections-removed-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.warningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('connectionsRemovedModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>{t('connectionsRemovedModalDescription')}</ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            block
            onClick={handleConfirm}
            data-testid="connections-removed-modal-button"
          >
            {t('gotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
