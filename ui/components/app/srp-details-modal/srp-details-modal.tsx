import PropTypes from 'prop-types';
import React from 'react';
import {
  Display,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ButtonPrimary,
  Text,
  ButtonPrimarySize,
} from '../../component-library';

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
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('srpDetailsTitle')}
          </Text>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd}>{t('srpDetailsDescription')}</Text>
          <Text variant={TextVariant.bodyMd} marginTop={4}>
            {t('srpDetailsOwnsAccessListTitle')}
          </Text>
          <Box as="ul" className="srp-details-modal__owning-access-list">
            <Box as="li">
              <Text variant={TextVariant.bodyMd}>
                {t('srpDetailsOwnsAccessListItemOne')}
              </Text>
            </Box>
            <Box as="li">
              <Text variant={TextVariant.bodyMd}>
                {t('srpDetailsOwnsAccessListItemTwo')}
              </Text>
            </Box>
            <Box as="li">
              <Text variant={TextVariant.bodyMd}>
                {t('srpDetailsOwnsAccessListItemThree')}
              </Text>
            </Box>
          </Box>
          <Box display={Display.Flex} marginTop={6} gap={2}>
            <ButtonPrimary
              size={ButtonPrimarySize.Lg}
              onClick={() => onClose()}
              block
            >
              {t('gotIt')}
            </ButtonPrimary>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

SRPDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
