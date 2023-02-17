import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SnapSettingsCard from '../../../../components/app/flask/snap-settings-card';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Typography from '../../../../components/ui/typography/typography';
import Dropdown from '../../../../components/ui/dropdown';
import {
  TypographyVariant,
  FLEX_DIRECTION,
  JustifyContent,
  AlignItems,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Box from '../../../../components/ui/box';
import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import {
  disableSnap,
  enableSnap,
  setSnapsTrustLevel,
} from '../../../../store/actions';
import { getSnaps, getSnapsTrustLevel } from '../../../../selectors';
import { handleSettingsRefs } from '../../../../helpers/utils/settings-search';

const SnapListTab = () => {
  const [selectedSnapsTrustLevel, setSelectedSnapsTrustLevel] =
    useState(undefined);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const snaps = useSelector(getSnaps);
  const snapsTrustLevel = useSelector(getSnapsTrustLevel);
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

  const snapsTrustLevelOptions = [
    { value: 'AuditedOnly', name: 'Audited Only' },
    { value: 'SafePermissionsOnly', name: 'Safe Permissions Only' },
    { value: 'Open', name: 'Open' },
  ];

  const handleTrustLevelDropdownChange = (trustLevel) => {
    console.log('log: mon trust level: ', trustLevel);
    setSelectedSnapsTrustLevel(trustLevel);
    dispatch(setSnapsTrustLevel(trustLevel));
    console.log('log: dispatched!');
  };
  console.log('log: snapsTrustLevel selector', snapsTrustLevel);

  return (
    <div className="snap-list-tab" ref={settingsRef}>
      <Dropdown
        onChange={handleTrustLevelDropdownChange}
        options={snapsTrustLevelOptions}
        selectedOption={selectedSnapsTrustLevel || snapsTrustLevel}
      ></Dropdown>
      {Object.entries(snaps).length ? (
        <div className="snap-list-tab__body">
          <Box display="flex" flexDirection={FLEX_DIRECTION.COLUMN}>
            <Typography variant={TypographyVariant.H5} marginBottom={2}>
              {t('expandExperience')}
            </Typography>
            <Typography
              variant={TypographyVariant.H6}
              color={TextColor.textAlternative}
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
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Typography
            variant={TypographyVariant.H4}
            color={TextColor.textAlternative}
          >
            <span>{t('noSnaps')}</span>
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default SnapListTab;
