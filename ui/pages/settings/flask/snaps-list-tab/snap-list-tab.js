import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SnapSettingsCard from '../../../../components/app/flask/snap-settings-card';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  JustifyContent,
  AlignItems,
  Color,
  TEXT_ALIGN,
  FLEX_DIRECTION,
  Size,
} from '../../../../helpers/constants/design-system';
import Box from '../../../../components/ui/box';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import { disableSnap, enableSnap } from '../../../../store/actions';
import { getSnaps } from '../../../../selectors';
import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';
import {
  BannerTip,
  BannerTipLogoType,
  ButtonLink,
  Icon,
  ICON_NAMES,
  ICON_SIZES,
  Text,
} from '../../../../components/component-library';

const SnapListTab = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const snaps = useSelector(getSnaps);
  const settingsRef = useRef();
  const onClick = (snap) => {
    console.log(snap);
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snap.id)}`);
  };
  const onToggle = (snap) => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.id));
    } else {
      dispatch(enableSnap(snap.id));
    }
  };

  useEffect(() => {
    handleSettingsRefs(t, t('snaps'), settingsRef);
  }, [settingsRef, t]);

  return (
    <div className="snap-list-tab" ref={settingsRef}>
      {Object.entries(snaps).length ? (
        <div className="snap-list-tab__body">
          <div className="snap-list-tab__wrapper">
            {Object.entries(snaps).map(([key, snap]) => {
              return (
                <SnapSettingsCard
                  className="snap-settings-card"
                  isEnabled={snap.enabled}
                  key={key}
                  onToggle={() => {
                    onToggle(snap);
                  }}
                  description={snap.manifest.description}
                  url={snap.id}
                  name={snap.manifest.proposedName}
                  status={snap.status}
                  version={snap.version}
                  onClick={() => {
                    onClick(snap);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <Box
          className="snap-list-tab__container--no-snaps"
          width="full"
          height="full"
          alignItems={AlignItems.center}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <Box
            className="snap-list-tab__container--no-snaps_inner"
            width="full"
            height="full"
            flexDirection={FLEX_DIRECTION.COLUMN}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <Icon
              name={ICON_NAMES.SNAPS}
              color={Color.iconMuted}
              className="snap-list-tab__no-snaps_icon"
              size={ICON_SIZES.AUTO}
            />
            <Text
              color={Color.textMuted}
              align={TEXT_ALIGN.CENTER}
              marginTop={4}
            >
              {t('noSnaps')}
            </Text>
          </Box>
          <Box
            className="snap-list-tab__container--no-snaps_banner-tip"
            width="full"
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.flexEnd}
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
          >
            <BannerTip
              logoType={BannerTipLogoType.Greeting}
              title={t('exploreMetaMaskSnaps')}
              description={t('extendWalletWithSnaps')}
            >
              <ButtonLink
                size={Size.auto}
                href="https://metamask.io/snaps/"
                target="_blank"
              >
                {`${t('learnMoreUpperCase')}`}
              </ButtonLink>
            </BannerTip>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default SnapListTab;
