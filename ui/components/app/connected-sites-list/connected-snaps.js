import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Box, IconName, IconSize, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MenuItem } from '../../ui/menu';
import { SNAPS_VIEW_ROUTE } from '../../../helpers/constants/routes';
import SnapAvatar from '../snaps/snap-avatar';
import { Display } from '../../../helpers/constants/design-system';
import ConnectedAccountsListOptions from '../connected-accounts-list/connected-accounts-list-options';

export default function ConnectedSnaps({ connectedSubjects, onDisconnect }) {
  const [showOptions, setShowOptions] = useState();
  const t = useI18nContext();
  const history = useHistory();

  const settingsClick = (id) => {
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(id)}`);
  };
  const renderListItemOptions = (snapId) => {
    return (
      <ConnectedAccountsListOptions
        onHideOptions={() => setShowOptions()}
        onShowOptions={() => setShowOptions(snapId)}
        show={showOptions === snapId}
      >
        <MenuItem
          iconName={IconName.Logout}
          onClick={(e) => {
            e.preventDefault();
            onDisconnect(snapId);
          }}
        >
          {t('disconnect')}
        </MenuItem>
        <MenuItem
          iconName={IconName.Setting}
          onClick={() => settingsClick(snapId)}
        >
          {t('snapsSettings')}
        </MenuItem>
      </ConnectedAccountsListOptions>
    );
  };

  return (
    <Box className="connected-sites-list__content-rows">
      {connectedSubjects.map((subject) => (
        <Box key={subject.origin} className="connected-sites-list__content-row">
          <Box className="connected-sites-list__subject-info" gap={2}>
            <SnapAvatar
              snapId={subject.origin}
              badgeSize={IconSize.Xs}
              avatarSize={IconSize.Md}
            />
            <Text display={Display.Block} as="strong">
              {subject.name}
            </Text>
          </Box>
          {renderListItemOptions(subject.origin)}
        </Box>
      ))}
    </Box>
  );
}

ConnectedSnaps.propTypes = {
  connectedSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      origin: PropTypes.string,
    }),
  ).isRequired,
  onDisconnect: PropTypes.func.isRequired,
};
