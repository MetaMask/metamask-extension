import React from 'react';
import PropTypes from 'prop-types';
import SnapSettingsCard from '../../../components/app/flask/snap-settings-card';
import { removeSnap } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Typography from '../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  COLORS,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
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
  if (viewingSnap) {
    return (
      <ViewSnap
        snap={currentSnap}
        onToggle={(event) => onToggle(event, currentSnap)}
        onRemove={(event) => {
          onRemove(event, currentSnap);
          dispatch(removeSnap(currentSnap.name));
        }}
      />
    );
  }
  return (
    <>
      {Object.entries(snaps).length ? (
        <>
          <Box
            display="flex"
            flexDirection={FLEX_DIRECTION.COLUMN}
            paddingTop={2}
          >
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
                  description={snap.description}
                  url={snap.name}
                  name={snap.name}
                  status={snap.status}
                  version={snap.version}
                  onClick={(event) => {
                    onClick(event, snap);
                  }}
                />
              );
            })}
          </div>
        </>
      ) : (
        <Box
          width="full"
          height="full"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant={TYPOGRAPHY.H4} color={COLORS.UI4}>
            {t('noSnaps')}
          </Typography>
        </Box>
      )}
    </>
  );
};

SnapListTab.propTypes = propTypes;

export default SnapListTab;
