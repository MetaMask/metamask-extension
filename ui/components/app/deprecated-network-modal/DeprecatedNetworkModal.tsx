import React from 'react';
import { Box } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonLink } from '../../component-library/button-link/button-link';
import { ButtonPrimary } from '../../component-library/button-primary/button-primary';
import { ButtonPrimarySize } from '../../component-library/button-primary/button-primary.types';
import { Modal } from '../../component-library/modal/modal';
import { ModalBody } from '../../component-library/modal-body/modal-body';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import { ModalOverlay } from '../../component-library/modal-overlay/modal-overlay';
import { Text } from '../../component-library/text/text';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

type DeprecatedNetworkModalProps = {
  onClose: () => void;
};

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
          className="flex"
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
