import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SnapSettingsCard from '../../../../components/app/snaps/snap-settings-card';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  JustifyContent,
  AlignItems,
  IconColor,
  Color,
  TextAlign,
  FlexDirection,
  Size,
  Display,
  BlockSize,
  FlexWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import { getSnapsList } from '../../../../selectors';
import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';
import {
  Box,
  BannerTip,
  BannerTipLogoType,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';

const SnapListTab = () => {
  const t = useI18nContext();
  const history = useHistory();
  const settingsRef = useRef();
  const onClick = (snap) => {
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snap.id)}`);
  };

  useEffect(() => {
    handleSettingsRefs(t, t('snaps'), settingsRef);
  }, [settingsRef, t]);

  const snapsList = useSelector((state) => getSnapsList(state));

  return (
    <Box
      className="snap-list-tab"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
    >
      {snapsList.length > 0 && (
        <div className="snap-list-tab__body">
          <div className="snap-list-tab__wrapper">
            {snapsList.map((snap) => {
              return (
                <SnapSettingsCard
                  className="snap-settings-card"
                  key={snap.key}
                  packageName={snap.packageName}
                  name={snap.name}
                  onClick={() => {
                    onClick(snap);
                  }}
                  snapId={snap.id}
                />
              );
            })}
          </div>
        </div>
      )}
      {snapsList.length <= 5 && (
        <Box
          display={Display.Flex}
          height={BlockSize.Full}
          flexDirection={FlexDirection.Row}
          flexWrap={FlexWrap.Wrap}
          justifyContent={JustifyContent.center}
          className="snap-list-tab__container--snaps-info-content"
        >
          {snapsList.length < 1 && (
            <Box
              className="snap-list-tab__container--no-snaps_inner"
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Icon
                name={IconName.Snaps}
                color={IconColor.iconMuted}
                className="snap-list-tab__no-snaps_icon"
                size={IconSize.Inherit}
              />
              <Text
                color={Color.textMuted}
                align={TextAlign.Center}
                marginTop={4}
              >
                {t('noSnaps')}
              </Text>
            </Box>
          )}
          <Box
            display={Display.Flex}
            width={BlockSize.Full}
            height={BlockSize.Min}
          ></Box>
          <Box
            className="snap-list-tab__container--no-snaps_banner-tip"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.flexEnd}
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
          >
            <BannerTip
              logoType={BannerTipLogoType.Greeting}
              description={t('extendWalletWithSnaps')}
              descriptionProps={{ variant: TextVariant.bodyMd }}
            >
              <ButtonLink
                size={Size.auto}
                href={
                  snapsList.length > 0
                    ? 'https://snaps.metamask.io/'
                    : 'https://metamask.io/snaps/'
                }
                target="_blank"
                endIconName={IconName.Export}
              >
                {`${t('discoverSnaps')}`}
              </ButtonLink>
            </BannerTip>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SnapListTab;
