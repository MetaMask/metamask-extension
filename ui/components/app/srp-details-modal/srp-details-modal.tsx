import PropTypes from 'prop-types';
import React from 'react';
import {
  BoxFlexDirection,
  Box,
  TextAlign,
  TextVariant,
  TextColor,
  Text,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { AlignItems } from '../../../helpers/constants/design-system';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function SRPDetailsModal({ onClose }: { onClose: () => void }) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="srp-details-modal"
      data-testid="srp-details-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
            {t('srpDetailsTitle')}
          </Text>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('srpDetailsDescription')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="mt-4"
          >
            {t('srpDetailsOwnsAccessListTitle')}
          </Text>
          <Box
            paddingLeft={6}
            className="srp-details-modal__owning-access-list list-disc"
            asChild
          >
            <ul>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                asChild
              >
                <li>{t('srpDetailsOwnsAccessListItemOne')}</li>
              </Text>

              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                <li>{t('srpDetailsOwnsAccessListItemTwo')}</li>
              </Text>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                <li>{t('srpDetailsOwnsAccessListItemThree')}</li>
              </Text>
            </ul>
          </Box>
          <Box flexDirection={BoxFlexDirection.Row} gap={2} className="mt-6">
            <Button
              size={ButtonSize.Lg}
              onClick={onClose}
              className="w-full"
              variant={ButtonVariant.Primary}
            >
              {t('gotIt')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

SRPDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
