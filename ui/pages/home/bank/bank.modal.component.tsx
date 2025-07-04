import React from 'react';
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

interface BankAccountRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: () => void;
}

const BankAccountRequiredModal: React.FC<BankAccountRequiredModalProps> = ({
  isOpen,
  onClose,
  onLink,
}) => {
  const t = useI18nContext();
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('bankTopic')}</ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
          >
            <img
              src={'/images/home/card.svg'}
              alt="CryptoBridge Card"
              style={{ width: 180, margin: '24px 0 16px 0' }}
            />
            <Text
              variant={TextVariant.headingSm}
              fontWeight={FontWeight.Bold}
              textAlign={TextAlign.Center}
              style={{ marginBottom: 8, color: '#121312' }}
            >
              {t('bankDes')}
            </Text>
            <Text
              textAlign={TextAlign.Center}
              color={TextColor.textAlternative}
              style={{ marginBottom: 8, color: '#121312' }}
            >
              {t('bankTips')}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter flexDirection={FlexDirection.Column} gap={2}>
          <Button
            type="primary"
            block
            style={{ marginBottom: 8, outline: 'none' }}
            onClick={onLink}
          >
            {t('bankBtn1')}
          </Button>
          <Button
            block
            className="bank-btn2"
            style={{
              marginBottom: 8,
              background: '#EDEDED',
              color: '#171717',
              outline: 'none',
            }}
            onClick={onLink}
          >
            {t('bankBtn2')}
          </Button>
          <Button
            block
            className="bank-btn3"
            onClick={onClose}
            style={{
              color: '#6F6F6F',
              background: 'none',
              outline: 'none',
            }}
          >
            {t('bankBtn3')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BankAccountRequiredModal;
