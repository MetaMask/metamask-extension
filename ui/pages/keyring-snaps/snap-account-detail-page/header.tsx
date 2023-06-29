import React, { useState } from 'react';
import ConfigureSnapPopup, {
  ConfigureSnapPopupType,
} from '../../../components/app/configure-snap-popup/configure-snap-popup';
import {
  BUTTON_VARIANT,
  Box,
  Button,
  Icon,
  IconName,
  Tag,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SnapCardProps } from '../new-snap-account-page/new-snap-account-page';
import { METAMASK_DEVELOPER } from '../constants';

export const SnapDetailHeader = ({
  updateAvailable,
  snapTitle,
  isInstalled,
  iconUrl,
  developer,
  auditUrls,
  website,
}: Pick<
  SnapCardProps,
  | 'updateAvailable'
  | 'snapTitle'
  | 'isInstalled'
  | 'iconUrl'
  | 'developer'
  | 'auditUrls'
  | 'website'
>) => {
  const t = useI18nContext();
  const [showConfigPopover, setShowConfigPopover] = useState(false);
  const [showConfigPopoverType, setShowConfigPopoverType] =
    useState<ConfigureSnapPopupType>(ConfigureSnapPopupType.INSTALL);

  return (
    <>
      <Box marginBottom={5}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          marginBottom={4}
        >
          <Button
            variant={BUTTON_VARIANT.LINK}
            marginRight={4}
            onClick={() => history.back()}
          >
            {t('snapDetailsCreateASnapAccount')}
          </Button>
          <Icon name={IconName.ArrowRight} marginRight={4} />
          <Text>{snapTitle}</Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
          >
            <Text variant={TextVariant.headingLg} marginRight={1}>
              {snapTitle}
            </Text>
            {isInstalled && (
              <Tag
                label={t('snapDetailsInstalled') as string}
                labelProps={{
                  color: TextColor.textAlternative,
                }}
                className=""
                height={2}
              />
            )}
          </Box>
          <Box>
            {isInstalled && updateAvailable && (
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                marginRight={1}
                onClick={() => {
                  setShowConfigPopoverType(ConfigureSnapPopupType.INSTALL);
                  setShowConfigPopover(true);
                }}
              >
                {t('snapUpdateAvailable')}
              </Button>
            )}
            {isInstalled && (
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => {
                  setShowConfigPopoverType(ConfigureSnapPopupType.CONFIGURE);
                  setShowConfigPopover(true);
                }}
              >
                {t('snapConfigure')}
              </Button>
            )}
            {!isInstalled && (
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => {
                  setShowConfigPopoverType(ConfigureSnapPopupType.INSTALL);
                  setShowConfigPopover(true);
                }}
              >
                {t('snapInstall')}
              </Button>
            )}
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            style={{
              borderRadius: '50%',
              height: '32px',
              width: '32px',
            }}
            borderWidth={1}
            borderColor={BorderColor.borderMuted}
            padding={[2, 2, 2, 2]}
            marginRight={1}
          >
            <img src={iconUrl} className="snap-detail-icon" />
          </Box>
          {developer.toLowerCase() === METAMASK_DEVELOPER && (
            <Tag
              color={TextColor.infoDefault}
              backgroundColor={BackgroundColor.infoMuted}
              borderColor={BackgroundColor.infoMuted}
              label={
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                >
                  <Icon name={IconName.Star} />{' '}
                  <Text
                    color={TextColor.infoDefault}
                    variant={TextVariant.bodySm}
                  >
                    {t('snapCreatedByMetaMask')}
                  </Text>
                </Box>
              }
              labelProps={{
                color: TextColor.infoDefault,
              }}
              className=""
              marginRight={1}
            />
          )}
          {auditUrls.length > 0 && (
            <Tag
              className=""
              color={TextColor.infoDefault}
              backgroundColor={BackgroundColor.infoMuted}
              borderColor={BackgroundColor.infoMuted}
              label={
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                >
                  <Icon name={IconName.Star} />{' '}
                  <Text
                    color={TextColor.infoDefault}
                    variant={TextVariant.bodySm}
                  >
                    {t('snapIsAudited')}
                  </Text>
                </Box>
              }
              labelProps={{
                color: TextColor.infoDefault,
              }}
            />
          )}
        </Box>
      </Box>
      <ConfigureSnapPopup
        type={showConfigPopoverType}
        isOpen={showConfigPopover}
        onClose={() => setShowConfigPopover(false)}
        link={website}
      />
    </>
  );
};
