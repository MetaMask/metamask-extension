import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import { TERMS_OF_USE_LINK } from '../../../../../shared/constants/terms';

import {
  BackgroundColor,
  BlockSize,
  Display,
  FontWeight,
  IconColor,
  AlignItems,
  JustifyContent,
  FlexDirection,
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';

import {
  AvatarIcon,
  Button,
  BUTTON_LINK_SIZES,
  BUTTON_PRIMARY_SIZES,
  BUTTON_VARIANT,
  ButtonLink,
  IconName,
  Text,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  AVATAR_ICON_SIZES,
} from '../../../component-library';

export default function SnapPrivacyWarning({ onAccepted, onCanceled, isOpen }) {
  const t = useI18nContext();
  const { isScrollable, isScrolledToBottom, scrollToBottom, ref, onScroll } =
    useScrollRequired();

  return (
    <Modal isOpen={isOpen} className="snap-privacy-warning">
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
          padding: 0,
        }}
      >
        <ModalHeader
          paddingTop={4}
          paddingLeft={4}
          paddingRight={4}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            justifyContent: JustifyContent.Center,
            gap: 4,
          }}
        >
          <AvatarIcon
            iconName={IconName.Info}
            color={IconColor.infoDefault}
            backgroundColor={BackgroundColor.primaryMuted}
            size={AVATAR_ICON_SIZES.XL}
          />
          <Text variant={TextVariant.headingMd} fontWeight={FontWeight.Bold}>
            {t('thirdPartySoftware')}
          </Text>
        </ModalHeader>
        <Box
          className="snap-privacy-warning__content"
          ref={ref}
          onScroll={onScroll}
          paddingLeft={4}
          paddingRight={2}
        >
          <Box className="snap-privacy-warning__message">
            <Text variant={TextVariant.bodyMd}>
              {t('snapsPrivacyWarningFirstMessage', [
                <ButtonLink
                  key="privacyNoticeTermsOfUseLink"
                  size={BUTTON_LINK_SIZES.INHERIT}
                  href={TERMS_OF_USE_LINK}
                  target="_blank"
                >
                  &nbsp;{t('snapsTermsOfUse')}&nbsp;
                </ButtonLink>,
              ])}
            </Text>
            <Text variant={TextVariant.bodyMd} paddingTop={6}>
              {t('snapsPrivacyWarningSecondMessage')}
            </Text>
            <Text
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Bold}
              paddingTop={6}
            >
              {t('snapsPrivacyWarningThirdMessage')}
            </Text>
          </Box>
          {isScrollable && !isScrolledToBottom ? (
            <AvatarIcon
              className="snap-privacy-warning__content__scroll-button"
              data-testid="snap-privacy-warning-scroll"
              iconName={IconName.Arrow2Down}
              backgroundColor={BackgroundColor.infoDefault}
              color={IconColor.infoInverse}
              onClick={scrollToBottom}
              style={{ cursor: 'pointer' }}
              as="button"
            />
          ) : null}
        </Box>

        <Box
          display={Display.Flex}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            size={BUTTON_PRIMARY_SIZES.LG}
            width={BlockSize.Full}
            onClick={onCanceled}
          >
            {t('cancel')}
          </Button>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            size={BUTTON_PRIMARY_SIZES.LG}
            width={BlockSize.Full}
            onClick={onAccepted}
            disabled={!isScrolledToBottom}
          >
            {t('accept')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

SnapPrivacyWarning.propTypes = {
  /**
   * Whether the modal is open or not
   */
  isOpen: PropTypes.bool.isRequired,
  /**
   * onAccepted handler
   */
  onAccepted: PropTypes.func.isRequired,
  /**
   * onCanceled handler
   */
  onCanceled: PropTypes.func.isRequired,
};
