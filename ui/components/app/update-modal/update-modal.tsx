import React from 'react';
import { useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  ModalHeader,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BorderRadius,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  setUpdateModalLastDismissedAt,
  setLastUpdatedAt,
  setIsUpdateAvailable,
} from '../../../store/actions';

function UpdateModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Modal
      isOpen={true}
      onClose={() => dispatch(setUpdateModalLastDismissedAt(Date.now()))}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="update-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => dispatch(setUpdateModalLastDismissedAt(Date.now()))}
          startAccessory={true}
          closeButtonProps={{ 'data-testid': 'update-modal-close-button' }}
        />
        <ModalBody display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderRadius={BorderRadius.SM}
            padding={10}
          >
            <img src="/images/logo/metamask-fox.svg" width={160} height={160} />
          </Box>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('getTheNewestFeatures')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            padding={4}
            paddingBottom={12}
          >
            {t('updateInformation')}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={() => {
            dispatch(setLastUpdatedAt(Date.now()));
            dispatch(setIsUpdateAvailable(false));
            browser.runtime.reload();
          }}
          submitButtonProps={{
            children: t('updateToTheLatestVersion'),
            block: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}

export default UpdateModal;
