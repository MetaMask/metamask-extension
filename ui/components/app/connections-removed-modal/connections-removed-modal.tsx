import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, BoxJustifyContent } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Modal } from '../../component-library/modal/modal';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import { ModalOverlay } from '../../component-library/modal-overlay/modal-overlay';
import { Text } from '../../component-library/text/text';
import { Button } from '../../component-library/button/button';
import { Icon } from '../../component-library/icon/icon';
import { IconSize, IconName } from '../../component-library/icon/icon.types';
import { ModalFooter } from '../../component-library/modal-footer/modal-footer';
import { ModalBody } from '../../component-library/modal-body/modal-body';
import { ButtonSize } from '../../component-library/button/button.types';
import { resetWallet } from '../../../store/actions';
import { isPopupOrSidePanelEnvironment } from '../../../../shared/lib/environment-type';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useDispatch } from '../../../store/hooks';

export default function ConnectionsRemovedModal() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleConfirm = async () => {
    await dispatch(resetWallet());

    if (isPopupOrSidePanelEnvironment()) {
      globalThis.platform.openExtensionInBrowser?.(DEFAULT_ROUTE);
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="connections-removed-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box>
            <Box className="flex" justifyContent={BoxJustifyContent.Center}>
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.warningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('connectionsRemovedModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>{t('connectionsRemovedModalDescription')}</ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            block
            onClick={handleConfirm}
            data-testid="connections-removed-modal-button"
          >
            {t('gotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
