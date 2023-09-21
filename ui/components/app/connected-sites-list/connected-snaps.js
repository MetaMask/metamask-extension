import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import { useDispatch, useSelector } from 'react-redux';
import { SnapCaveatType } from '@metamask/rpc-methods';
import { Box, IconName, IconSize, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MenuItem } from '../../ui/menu';
import { SNAPS_VIEW_ROUTE } from '../../../helpers/constants/routes';
import SnapAvatar from '../snaps/snap-avatar';
import { Display } from '../../../helpers/constants/design-system';
import ConnectedAccountsListOptions from '../connected-accounts-list/connected-accounts-list-options';
import {
  getOriginOfCurrentTab,
  getPermissionSubjects,
} from '../../../selectors';
import { removePermissionsFor, updateCaveat } from '../../../store/actions';

export default function ConnectedSnaps({ connectedSubjects }) {
  const [showOptions, setShowOptions] = useState();
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const subjects = useSelector((state) => getPermissionSubjects(state));
  const connectedOrigin = useSelector(getOriginOfCurrentTab);

  const onDisconnect = (snapId) => {
    const caveatValue =
      subjects[connectedOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    console.log(newCaveatValue, 'newCaveatValue');
    if (Object.keys(newCaveatValue) > 0) {
      dispatch(
        updateCaveat(
          connectedOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
    }
  };

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
};
