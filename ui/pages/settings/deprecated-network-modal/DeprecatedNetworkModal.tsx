import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  ButtonLink,
  ButtonPrimary,
  ButtonPrimarySize,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  Display,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

interface DeprecatedNetworkModalProps {
  onClose: () => void;
}

export const DeprecatedNetworkModal = ({
  onClose,
}: DeprecatedNetworkModalProps) => {
  const t = useI18nContext();

  return (
    <Modal isOpen isClosedOnOutsideClick={false} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader paddingTop={2} paddingBottom={2}>
          {t('deprecatedNetwork')}
        </ModalHeader>
        <ModalBody>
          <Box paddingBottom={2}>
            <Text
              textAlign={TextAlign.Center}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Normal}
            >
              {t('deprecatedNetworkDescription', [
                <ButtonLink
                  key="import-token-fake-token-warning"
                  rel="noopener noreferrer"
                  target="_blank"
                  href={ZENDESK_URLS.NETWORK_DEPRECATED}
                  variant={TextVariant.bodySm}
                  fontWeight={FontWeight.Normal}
                >
                  {t('learnMoreUpperCase')}
                </ButtonLink>,
              ])}
            </Text>
          </Box>
        </ModalBody>
        <Box
          display={Display.Flex}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={2}
        >
          <ButtonPrimary
            block
            size={ButtonPrimarySize.Lg}
            onClick={onClose}
            textProps={{ variant: TextVariant.bodyMdMedium }}
            style={{ fontSize: '14px' }}
          >
            {t('deprecatedNetworkButtonMsg')}
          </ButtonPrimary>
        </Box>
      </ModalContent>
    </Modal>
  );
};
