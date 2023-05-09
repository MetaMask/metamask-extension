import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box/box';
import Popover from '../../../ui/popover';
import {
  AvatarIcon,
  Button,
  BUTTON_LINK_SIZES,
  BUTTON_PRIMARY_SIZES,
  BUTTON_VARIANT,
  ButtonLink,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BLOCK_SIZES,
  DISPLAY,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';

export default function SnapPrivacyWarning({ onAccepted, onCanceled }) {
  const t = useI18nContext();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const handleReadMoreClick = () => {
    setIsDescriptionOpen(true);
  };

  return (
    <Popover className="snap-privacy-warning">
      <Box padding={4}>
        <Box
          className="snap-privacy-warning__info-icon"
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <AvatarIcon
            iconName={IconName.Info}
            color={IconColor.infoDefault}
            backgroundColor={BackgroundColor.primaryMuted}
            size={IconSize.Md}
          />
        </Box>
        <Box
          className="snap-privacy-warning__title"
          marginTop={4}
          marginBottom={6}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.headingMd}>{t('thirdPartySoftware')}</Text>
        </Box>
        <Box className="snap-privacy-warning__message">
          <Text variant={TextVariant.bodyMd}>
            {t('snapsPrivacyWarningFirstMessage')}
          </Text>
          {!isDescriptionOpen && (
            <>
              <Text variant={TextVariant.bodyMd} paddingTop={6}>
                {t('snapsPrivacyWarningSecondMessage')}
              </Text>
              <Text
                variant={TextVariant.bodyMd}
                className="snap-privacy-warning__more-details"
              >
                {t('click')}
                <ButtonLink
                  size={BUTTON_LINK_SIZES.INHERIT}
                  onClick={handleReadMoreClick}
                  data-testid="snapsPrivacyPopup_readMoreButton"
                >
                  &nbsp;{t('here')}&nbsp;
                </ButtonLink>
                {t('forMoreDetails')}
              </Text>
            </>
          )}
          {isDescriptionOpen && (
            <>
              <Text variant={TextVariant.bodyMd} paddingTop={6}>
                {t('snapsThirdPartyNoticeReadMorePartOne')}
              </Text>
              <Text variant={TextVariant.bodyMd} paddingTop={6}>
                {t('snapsThirdPartyNoticeReadMorePartTwo')}
              </Text>
              <Text variant={TextVariant.bodyMd} paddingTop={6}>
                {t('snapsThirdPartyNoticeReadMorePartThree')}
              </Text>
            </>
          )}
        </Box>
        <Box
          className="snap-privacy-warning__ok-button"
          marginTop={6}
          display={DISPLAY.FLEX}
        >
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            size={BUTTON_PRIMARY_SIZES.LG}
            width={BLOCK_SIZES.FULL}
            className="snap-privacy-warning__cancel-button"
            onClick={onCanceled}
            marginRight={2}
          >
            {t('cancel')}
          </Button>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            size={BUTTON_PRIMARY_SIZES.LG}
            width={BLOCK_SIZES.FULL}
            className="snap-privacy-warning__ok-button"
            onClick={onAccepted}
            marginLeft={2}
          >
            {t('accept')}
          </Button>
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
