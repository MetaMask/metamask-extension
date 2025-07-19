import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
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
import { setShowConnectionsRemovedModal } from '../../../store/actions';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConnectionsRemovedModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const onConfirm = useCallback(() => {
    dispatch(setShowConnectionsRemovedModal(false));
  }, [dispatch]);

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
          <Button size={ButtonSize.Lg} block onClick={onConfirm}>
            {t('gotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
