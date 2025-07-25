import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSize,
  Button,
  Icon,
  IconSize,
  IconName,
} from '../../component-library';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { lockMetamask } from '../../../store/actions';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PasswordOutdatedModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="password-outdated-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.warningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('passwordChangedRecently')}
            </Text>
            <Text variant={TextVariant.bodySm} marginTop={4}>
              {t('passwordChangedRecentlyDescription')}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Box display={Display.Flex} marginTop={2} gap={4}>
            <Button
              data-testid="password-changed"
              size={ButtonSize.Lg}
              block
              onClick={() => {
                dispatch(lockMetamask());
                history.push(DEFAULT_ROUTE);
              }}
            >
              {t('continue')}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
