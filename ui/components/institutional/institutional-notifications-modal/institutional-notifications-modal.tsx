import React, { useEffect, useState } from 'react';
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

const InstitutionalNotificationsModal: React.FC = () => {
  const t = useI18nContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModalStatus = () => {
      const modalShown = localStorage.getItem(
        'institutionalNotificationsModalShown',
      );
      if (modalShown !== 'true') {
        setIsModalOpen(true);
      }
    };

    checkModalStatus();

    // Listen for storage changes to handle multiple tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'institutionalNotificationsModalShown' &&
        event.newValue === 'true'
      ) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClose = () => {
    try {
      setIsModalOpen(false);
      localStorage.setItem('institutionalNotificationsModalShown', 'true');
    } catch (error) {
      console.error('Failed to set modal flag in localStorage:', error);
    }
  };

  const findOutMore = () => {
    window.open('https://institutional.metamask.io/', '_blank');
    handleClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>{t('whatsNew')}</ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            marginBottom={4}
          >
            <img
              src="images/MMI.png"
              alt="MetaMask Institutional"
              style={{
                width: '80px',
                height: '80px',
                marginRight: '-10px',
                zIndex: 1,
              }}
            />
            <img
              src="images/MHC.png"
              alt="MHC Digital Group"
              style={{ width: '80px', height: '80px' }}
            />
          </Box>

          <Text variant={TextVariant.headingSm} marginBottom={8}>
            {t('institutionalNotificationsModalTitle')}
          </Text>

          <Text variant={TextVariant.bodyMd} marginBottom={8}>
            {t('institutionalNotificationsModalDescription')}
          </Text>

          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Medium}
            marginBottom={2}
          >
            {t('institutionalNotificationsModalSubtitle')}
          </Text>

          <Text variant={TextVariant.bodyMd} marginBottom={1}>
            {t('institutionalNotificationsModalDescription2')}
          </Text>

          <Text variant={TextVariant.bodyMd} marginBottom={4}>
            {t('institutionalNotificationsModalDescription3')}
          </Text>

          <Button
            block
            variant={ButtonVariant.Primary}
            onClick={findOutMore}
            borderRadius={BorderRadius.pill}
          >
            {t('institutionalNotificationsModalFindOutMore')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default InstitutionalNotificationsModal;
