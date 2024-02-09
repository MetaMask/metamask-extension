import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SnapListItem from '../../../components/app/snaps/snap-list-item';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getAllSnapAvailableUpdates, getSnapsList } from '../../../selectors';
import { handleSettingsRefs } from '../../../helpers/utils/settings-search';
import {
  Box,
  BannerTip,
  BannerTipLogoType,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
  ButtonIcon,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { getSnapRoute } from '../../../helpers/utils/util';

const SnapList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const settingsRef = useRef();
  const onClick = (snap) => {
    history.push(getSnapRoute(snap.id));
  };

  useEffect(() => {
    handleSettingsRefs(t, t('snaps'), settingsRef);
  }, [settingsRef, t]);

  const snapsList = useSelector(getSnapsList);
  const snapUpdateMap = useSelector(getAllSnapAvailableUpdates);

  return (
    <div className="snaps">
      <Page backgroundColor={BackgroundColor.backgroundDefault}>
        <Header
          backgroundColor={BackgroundColor.backgroundDefault}
          startAccessory={
            <ButtonIcon
              ariaLabel="Back"
              iconName="arrow-left"
              size="sm"
              onClick={() => history.push(DEFAULT_ROUTE)}
            />
          }
        >
          {t('snaps')}
        </Header>
        <Content
          backgroundColor={BackgroundColor.backgroundDefault}
          className="snaps__content"
        >
          <Box
            className="snaps__content__list"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            height={BlockSize.Full}
          >
            {snapsList.length > 0 && (
              <div className="snaps__content__list__body">
                <div className="snaps__content__list__wrapper">
                  {snapsList.map((snap) => {
                    return (
                      <SnapListItem
                        className="snaps__content__list-item"
                        key={snap.key}
                        packageName={snap.packageName}
                        name={snap.name}
                        onClick={() => {
                          onClick(snap);
                        }}
                        snapId={snap.id}
                        showUpdateDot={snapUpdateMap.get(snap.id)}
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
                className="snaps__content__list__container--snaps-info-content"
              >
                {snapsList.length < 1 && (
                  <Box
                    className="snaps__content__list__container--no-snaps_inner"
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    justifyContent={JustifyContent.center}
                    alignItems={AlignItems.center}
                  >
                    <Icon
                      name={IconName.Snaps}
                      color={IconColor.iconMuted}
                      className="snaps__content__list__no-snaps_icon"
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
                  className="snaps__content__list__container--no-snaps_banner-tip"
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
        </Content>
      </Page>
    </div>
  );
};

export default SnapList;
