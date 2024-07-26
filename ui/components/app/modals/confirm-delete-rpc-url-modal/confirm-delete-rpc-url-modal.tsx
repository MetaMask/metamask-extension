import React from 'react';
import { useDispatch } from 'react-redux';
import {
  BlockSize,
  Display,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  hideModal,
  setEditedNetwork,
  toggleNetworkMenu,
} from '../../../../store/actions';
import { useModalProps } from '../../../../hooks/useModalProps';

const ConfirmDeleteRpcUrlModal = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { props } = useModalProps();
  console.log('props --------', props);

  return (
    <Modal
      isClosedOnEscapeKey={true}
      isClosedOnOutsideClick={true}
      isOpen={true}
      onClose={() => {
        dispatch(setEditedNetwork());
        dispatch(hideModal());
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('confirmDeletion')}</ModalHeader>
        <ModalBody>
          <Box>{t('confirmRpcUrlDeletionMessage')}</Box>
          <Box display={Display.Flex} gap={4} marginTop={6}>
            <ButtonSecondary
              width={BlockSize.Full}
              size={ButtonSecondarySize.Lg}
              onClick={() => {
                dispatch(hideModal());
                dispatch(toggleNetworkMenu());
              }}
            >
              {t('back')}
            </ButtonSecondary>
            <ButtonPrimary
              width={BlockSize.Full}
              size={ButtonPrimarySize.Lg}
              danger={true}
              onClick={() => {
                console.log('TODO: Delete RPc URL');

                props.onRpcUrlAdd((prevState) => {
                  return prevState.filter(
                    (item) =>
                      !(item.url === props.url && item.isSelected === false),
                  );
                });
              }}
            >
              {t('deleteRpcUrl')}
            </ButtonPrimary>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDeleteRpcUrlModal;
