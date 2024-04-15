import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Text,
  Modal,
  ModalFooter,
  ModalBody,
  ModalContent,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FontWeight,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import { TERMS_OF_USE_LINK } from '../../../../../shared/constants/terms';

export default function SnapPrivacyWarning({ onAccepted, onCanceled }) {
  const t = useI18nContext();
  const { isScrollable, isScrolledToBottom, scrollToBottom, ref, onScroll } =
    useScrollRequired();

  return (
    <Modal onClose={() => null} isOpen className="snap-install-warning">
      <ModalContent>
        <ModalBody className="snap-privacy-warning">
          <Box>
            <Box className="snap-privacy-warning__header">
              <Box
                marginTop={4}
                className="snap-privacy-warning__header__info-icon"
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
              >
                <AvatarIcon
                  iconName={IconName.Info}
                  color={IconColor.infoDefault}
                  backgroundColor={BackgroundColor.primaryMuted}
                  size={AvatarIconSize.Md}
                />
              </Box>
              <Box
                className="snap-privacy-warning__header__title"
                marginTop={4}
                marginBottom={4}
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
              >
                <Text
                  variant={TextVariant.headingMd}
                  fontWeight={FontWeight.Bold}
                >
                  {t('thirdPartySoftware')}
                </Text>
              </Box>
            </Box>
            <Box
              className="snap-privacy-warning__content"
              ref={ref}
              onScroll={onScroll}
            >
              <Box className="snap-privacy-warning__message">
                <Text variant={TextVariant.bodyMd}>
                  {t('snapsPrivacyWarningFirstMessage', [
                    <ButtonLink
                      className="snap-privacy-warning__content__terms-link"
                      key="privacyNoticeTermsOfUseLink"
                      size={ButtonLinkSize.Inherit}
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
                  color={IconColor.primaryInverse}
                  onClick={scrollToBottom}
                  style={{ cursor: 'pointer' }}
                />
              ) : null}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onSubmit={onAccepted}
          onCancel={onCanceled}
          submitButtonProps={{
            children: t('accept'),
            disabled: !isScrolledToBottom,
          }}
          cancelButtonProps={{ children: t('cancel') }}
        />
      </ModalContent>
    </Modal>
  );
}

SnapPrivacyWarning.propTypes = {
  /**
   * onAccepted handler
   */
  onAccepted: PropTypes.func.isRequired,
  /**
   * onCanceled handler
   */
  onCanceled: PropTypes.func.isRequired,
};
