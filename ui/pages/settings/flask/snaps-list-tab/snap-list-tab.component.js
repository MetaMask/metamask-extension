import React from 'react';
import PropTypes from 'prop-types';
import SnapSettingsCard from '../../../../components/app/flask/snap-settings-card';
import {
  removeSnap,
  removeSnapPermissionsFromSubjects,
} from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Typography from '../../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  COLORS,
  FLEX_DIRECTION,
} from '../../../../helpers/constants/design-system';
import Box from '../../../../components/ui/box';
import ViewSnap from './view-snap';

const propTypes = {
  snaps: PropTypes.object.isRequired,
  viewingSnap: PropTypes.bool,
  currentSnap: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const SnapListTab = ({
  snaps,
  viewingSnap,
  currentSnap,
  onClick,
  onRemove,
  onToggle,
  dispatch,
}) => {
  const t = useI18nContext();
  if (viewingSnap && currentSnap) {
    return (
      <ViewSnap
        snap={currentSnap}
        onToggle={(event) => onToggle(event, currentSnap)}
        onRemove={async (event) => {
          await dispatch(removeSnap(currentSnap.id));
          await dispatch(
            removeSnapPermissionsFromSubjects(currentSnap.permissionName),
          );
          onRemove(event, currentSnap);
        }}
      />
    );
  }
  return (
    <>
      {Object.entries(snaps).length ? (
        <div className="snap-settings-page__body">
          <Box display="flex" flexDirection={FLEX_DIRECTION.COLUMN}>
            <Typography variant={TYPOGRAPHY.H5} marginBottom={2}>
              {t('expandExperience')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.UI4}
              marginBottom={2}
            >
              {t('manageSnaps')}
            </Typography>
          </Box>
          <div className="snaps-list-wrapper">
            {Object.entries(snaps).map(([key, snap]) => {
              return (
                <SnapSettingsCard
                  className="snap-settings-card"
                  isEnabled={snap.enabled}
                  dateAdded={new Date().toDateString()}
                  key={key}
                  onToggle={(event) => {
                    onToggle(event, snap);
                  }}
                  description={snap.manifest.description}
                  url={snap.id}
                  name={snap.manifest.proposedName}
                  status={snap.status}
                  version={snap.version}
                  onClick={(event) => {
                    onClick(event, snap);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="no-snap-container">
          <Typography
            className="no-snaps-text"
            variant={TYPOGRAPHY.H4}
            color={COLORS.UI4}
          >
            {t('noSnaps')}
          </Typography>
        </div>
      )}
    </>
  );
};

SnapListTab.propTypes = propTypes;

export default SnapListTab;
