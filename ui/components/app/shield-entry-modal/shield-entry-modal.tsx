import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Button,
  ModalFooter,
  ModalBody,
  ButtonSize,
  IconName,
  Box,
  AvatarIcon,
  AvatarIconSize,
  ButtonVariant,
  ButtonLink,
  ButtonLinkSize,
} from '../../component-library';
import { ThemeType } from '../../../../shared/constants/preferences';
import { setShowShieldEntryModalOnce } from '../../../store/actions';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getBrowserWindowType } from '../../../../shared/modules/browser-runtime.utils';
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ShieldEntryModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOnClose = () => {
    dispatch(setShowShieldEntryModalOnce(false));
  };

  const handleOnGetStarted = () => {
    dispatch(setShowShieldEntryModalOnce(false));
    const windowType = getBrowserWindowType();
    if (windowType === ENVIRONMENT_TYPE_FULLSCREEN) {
      navigate(SHIELD_PLAN_ROUTE);
    } else {
      global.platform.openExtensionInBrowser?.(SHIELD_PLAN_ROUTE);
    }
  };

  return (
    <Modal
      data-testid="shield-entry-modal"
      isOpen
      onClose={handleOnClose}
      className="shield-entry-modal"
    >
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.flexStart}
        modalDialogProps={{ paddingTop: 0, paddingBottom: 6 }}
      >
        {/* TODO: update with full image banner */}
        <ModalHeader
          className="shield-entry-modal__header h-[160px]"
          data-theme={ThemeType.dark}
          closeButtonProps={{
            className: 'absolute top-2 right-2',
          }}
          onClose={handleOnClose}
        />
        <ModalBody paddingTop={4}>
          <Text variant={TextVariant.headingMd} marginBottom={1}>
            {t('shieldEntryModalSubtitle')}
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            {/* TODO: update link to learn more page */}
            {t('shieldEntryModalDescription', [
              '$8',
              <ButtonLink
                key="learn-more-link"
                size={ButtonLinkSize.Inherit}
                target="_blank"
                rel="noopener noreferrer"
                href="#"
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>,
            ])}
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon size={AvatarIconSize.Sm} iconName={IconName.Plant} />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalAssetCoverage')}
              </Text>
            </Box>
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon
                size={AvatarIconSize.Sm}
                iconName={IconName.ShieldLock}
              />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalProtection')}
              </Text>
            </Box>
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              <AvatarIcon size={AvatarIconSize.Sm} iconName={IconName.Flash} />
              <Text variant={TextVariant.bodySm}>
                {t('shieldEntryModalSupport')}
              </Text>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              data-testid="shield-entry-modal-skip-button"
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              block
              onClick={handleOnClose}
            >
              {t('shieldEntryModalSkip')}
            </Button>
            <Button
              data-testid="shield-entry-modal-get-started-button"
              size={ButtonSize.Lg}
              block
              onClick={handleOnGetStarted}
            >
              {t('shieldEntryModalGetStarted')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
