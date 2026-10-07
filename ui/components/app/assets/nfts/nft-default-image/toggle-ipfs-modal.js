import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../../../../component-library/box/box';
import { ButtonPrimary } from '../../../../component-library/button-primary/button-primary';
import { Modal } from '../../../../component-library/modal/modal';
import { ModalOverlay } from '../../../../component-library/modal-overlay/modal-overlay';
import { Text } from '../../../../component-library/text/text';
import { ModalContent } from '../../../../component-library/modal-content/deprecated/modal-content';
import { ModalHeader } from '../../../../component-library/modal-header/deprecated/modal-header';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  hideIpfsModal,
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
} from '../../../../../store/actions';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../../../../shared/constants/network';
import { useDispatch } from '../../../../../store/hooks';

import {
  Size,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

export const ToggleIpfsModal = ({ onClose }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Modal isOpen onClose={onClose} className="toggle-ipfs-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('showNft')}</ModalHeader>
        <Box className="toggle-ipfs-modal" marginTop={6}>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('ipfsToggleModalDescriptionOne')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginTop={6}
          >
            {t('ipfsToggleModalDescriptionTwo', [
              <Text
                variant={TextVariant.bodyMdBold}
                color={TextColor.textAlternative}
                as="span"
                key="span"
              >
                {t('ipfsToggleModalSettings')},
              </Text>,
            ])}
          </Text>
        </Box>
        <ButtonPrimary
          block
          marginTop={9}
          onClick={() => {
            dispatch(setIpfsGateway(IPFS_DEFAULT_GATEWAY_URL));
            dispatch(setIsIpfsGatewayEnabled(true));
            dispatch(hideIpfsModal());
          }}
          size={Size.LG}
        >
          {t('confirm')}
        </ButtonPrimary>
      </ModalContent>
    </Modal>
  );
};

ToggleIpfsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
