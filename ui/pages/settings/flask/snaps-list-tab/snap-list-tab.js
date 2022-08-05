import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SnapSettingsCard from '../../../../components/app/flask/snap-settings-card';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Typography from '../../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  COLORS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  ALIGN_ITEMS,
} from '../../../../helpers/constants/design-system';
import Box from '../../../../components/ui/box';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import { disableSnap, enableSnap } from '../../../../store/actions';
import { getSnaps } from '../../../../selectors';
import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';

const SnapListTab = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const snaps = useSelector(getSnaps);
  const settingsRef = useRef();
  const onClick = (snap) => {
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
          <Box display="flex" flexDirection={FLEX_DIRECTION.COLUMN}>
            <Typography variant={TYPOGRAPHY.H5} marginBottom={2}>
              {t('expandExperience')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.TEXT_ALTERNATIVE}
              marginBottom={2}
            >
              {t('manageSnaps')}
            </Typography>
          </Box>
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
          justifyContent={JUSTIFY_CONTENT.CENTER}
          alignItems={ALIGN_ITEMS.CENTER}
        >
          <Typography variant={TYPOGRAPHY.H4} color={COLORS.TEXT_ALTERNATIVE}>
            <span>{t('noSnaps')}</span>
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default SnapListTab;
