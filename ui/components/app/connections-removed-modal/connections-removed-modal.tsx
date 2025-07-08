import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
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

export default function ConnectionsRemovedModal() {
  const t = useI18nContext();

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
        <ModalBody>
          {t('connectionsRemovedModalDescription', [
            <Text
              as="a"
              target="_blank"
              rel="noopener noreferrer"
              color={TextColor.infoDefault}
            >
              {t('learnMoreUpperCase')}
            </Text>,
          ])}
        </ModalBody>
        <ModalFooter>
          <Button size={ButtonSize.Lg} block>
            {t('gotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
