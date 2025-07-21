import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ButtonPrimary,
  FormTextField,
  Box,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountLabel } from '../../../store/actions';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type EditAccountNameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentAccountName: string;
  address: string;
};

export const EditAccountNameModal = ({
  isOpen,
  onClose,
  currentAccountName,
  address,
}: EditAccountNameModalProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [accountName, setAccountName] = useState('');

  const handleSave = () => {
    if (accountName.trim() && accountName !== currentAccountName) {
      dispatch(setAccountLabel(address, accountName.trim()));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} onBack={onClose}>
          {t('editAccountName')}
        </ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Box>
              <FormTextField
                label={t('name')}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={currentAccountName}
                autoFocus
              />
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                style={{
                  wordBreak: 'break-all',
                }}
                paddingTop={1}
              >
                {address}
              </Text>
            </Box>
            <ButtonPrimary
              onClick={handleSave}
              disabled={!accountName.trim()}
              aria-label={t('save')}
              block
              marginTop={4}
            >
              {t('save')}
            </ButtonPrimary>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
