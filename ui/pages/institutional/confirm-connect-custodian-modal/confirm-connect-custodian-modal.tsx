import React from 'react';
import {
  AlignItems,
  Display,
  TextColor,
  FlexDirection,
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  Button,
  ButtonVariant,
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

type ConfirmConnectCustodianModalProps = {
  onModalClose: () => void;
  custodianName: string;
  custodianURL?: string;
};

const ConfirmConnectCustodianModal: React.FC<
  ConfirmConnectCustodianModalProps
> = ({ onModalClose, custodianName, custodianURL }) => {
  const t = useI18nContext();

  return (
    <Modal
      onClose={onModalClose}
      isOpen
      isClosedOnOutsideClick
      isClosedOnEscapeKey
      className="mm-modal__custom-scrollbar"
      data-testid="confirm-connect-custodian-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onModalClose}>
          {t('connectCustodianAccounts', [custodianName])}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingTop={5}
        >
          <Text
            paddingTop={3}
            paddingLeft={4}
            paddingRight={4}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {t('confirmConnectCustodianText', [custodianName])}
          </Text>

          <Text
            paddingTop={3}
            paddingLeft={4}
            paddingRight={4}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {t('confirmConnectCustodianRedirect', [custodianURL])}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            paddingTop={5}
            paddingBottom={5}
          >
            <Button onClick={() => window.open(custodianURL, '_blank')}>
              {t('continue')}
            </Button>
            <Button
              paddingTop={3}
              variant={ButtonVariant.Link}
              onClick={onModalClose}
            >
              {t('cancel')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmConnectCustodianModal;
