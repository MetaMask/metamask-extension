import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Popover from '../../../ui/popover';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANT,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
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
    <Popover className="snap-privacy-warning">
      <Box>
        <Box
          className="snap-privacy-warning__header"
          paddingLeft={4}
          paddingRight={4}
        >
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
            <Text variant={TextVariant.headingMd} fontWeight={FontWeight.Bold}>
              {t('thirdPartySoftware')}
            </Text>
          </Box>
        </Box>
        <Box
          paddingLeft={4}
          paddingRight={4}
          className="snap-privacy-warning__content"
          ref={ref}
          onScroll={onScroll}
        >
          <Box className="snap-privacy-warning__message">
            <Text variant={TextVariant.bodyMd}>
              {t('snapsPrivacyWarningFirstMessage', [
                <ButtonLink
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
        <Box
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
          className="snap-privacy-warning__footer"
        >
          <Box
            className="snap-privacy-warning__footer"
            marginTop={6}
            display={Display.Flex}
          >
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              size={BUTTON_SIZES.LG}
              width={BlockSize.Full}
              className="snap-privacy-warning__cancel-button"
              onClick={onCanceled}
              marginRight={2}
            >
              {t('cancel')}
            </Button>
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              size={BUTTON_SIZES.LG}
              width={BlockSize.Full}
              className="snap-privacy-warning__ok-button"
              onClick={onAccepted}
              marginLeft={2}
              disabled={!isScrolledToBottom}
            >
              {t('accept')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Popover>
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
