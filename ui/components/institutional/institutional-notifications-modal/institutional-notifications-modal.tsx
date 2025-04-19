import React, { memo, useEffect, useState, useCallback } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  BorderRadius,
  FontWeight,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalOverlay,
  Text,
  Box,
  Button,
  ButtonVariant,
  ModalHeader,
  ModalContent,
} from '../../component-library';

// Custom Hook for managing modal visibility via localStorage
const useModalVisibility = (key: string, initialValue: boolean = false) => {
  const [isVisible, setIsVisible] = useState(initialValue);

  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue === 'true') {
          setIsVisible(false);
        }
      }
    },
    [key],
  );

  useEffect(() => {
    try {
      const modalShown = localStorage.getItem(key);
      if (modalShown !== 'true') {
        setIsVisible(true);
      }
    } catch (error) {
      console.error(`Failed to retrieve '${key}' from localStorage:`, error);
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, handleStorageChange]);

  const hideModal = useCallback(() => {
    try {
      setIsVisible(false);
      localStorage.setItem(key, 'true');
    } catch (error) {
      console.error(`Failed to set '${key}' in localStorage:`, error);
    }
  }, [key]);

  return { isVisible, hideModal };
};

const styles = {
  imageContainer: {
    display: Display.Flex,
    justifyContent: JustifyContent.center,
    marginBottom: '16px',
  },
  institutionImage: {
    width: '80px',
    height: '80px',
    marginRight: '-10px',
    zIndex: 1,
  },
  groupImage: {
    width: '80px',
    height: '80px',
  },
  modalContentBox: {
    display: Display.Flex,
    flexDirection: FlexDirection.Column,
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingBottom: '16px',
  },
  heading: {
    marginBottom: '32px',
  },
  description: {
    marginBottom: '32px',
  },
  subtitle: {
    fontWeight: FontWeight.Medium,
    marginBottom: '8px',
  },
  findOutMoreButton: {
    marginTop: '16px',
  },
};

const InstitutionalNotificationsModal: React.FC = () => {
  const t = useI18nContext();
  const { isVisible, hideModal } = useModalVisibility(
    'institutionalOnRampsModalShown',
  );

  const handleClose = useCallback(() => {
    hideModal();
  }, [hideModal]);

  const findOutMore = useCallback(() => {
    window.open(
      'https://institutional.metamask.io/',
      '_blank',
      'noopener,noreferrer',
    );
    hideModal();
  }, [hideModal]);

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleClose}
      aria-labelledby="institutional-notifications-modal-title"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>{t('whatsNew')}</ModalHeader>
        <Box style={styles.modalContentBox}>
          <Box style={styles.imageContainer}>
            <img
              src="images/MMI.png"
              alt="MetaMask Institutional"
              style={styles.institutionImage}
              loading="lazy"
            />
            <img
              src="images/MHC.png"
              alt="MHC Digital Group"
              style={styles.groupImage}
              loading="lazy"
            />
          </Box>

          <Text variant={TextVariant.headingSm} style={styles.heading}>
            {t('institutionalNotificationsModalTitle')}
          </Text>

          <Text variant={TextVariant.bodyMd} style={styles.description}>
            {t('institutionalNotificationsModalDescription')}
          </Text>

          <Text variant={TextVariant.bodyMd} style={styles.subtitle}>
            {t('institutionalNotificationsModalSubtitle')}
          </Text>

          <Text variant={TextVariant.bodyMd} style={{ marginBottom: '8px' }}>
            {t('institutionalNotificationsModalDescription2')}
          </Text>

          <Text variant={TextVariant.bodyMd} style={{ marginBottom: '16px' }}>
            {t('institutionalNotificationsModalDescription3')}
          </Text>

          <Button
            block
            variant={ButtonVariant.Primary}
            onClick={findOutMore}
            borderRadius={BorderRadius.pill}
            style={styles.findOutMoreButton}
            aria-label={t('institutionalNotificationsModalFindOutMore')}
          >
            {t('institutionalNotificationsModalFindOutMore')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default memo(InstitutionalNotificationsModal);
