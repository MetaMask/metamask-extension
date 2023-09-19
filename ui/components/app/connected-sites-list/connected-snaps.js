import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import { SnapCaveatType } from '@metamask/rpc-methods-flask';
import { useDispatch, useSelector } from 'react-redux';
import { Box, ButtonIcon, IconName, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Menu, MenuItem } from '../../ui/menu';
import { SNAPS_VIEW_ROUTE } from '../../../helpers/constants/routes';
import SnapAvatar from '../snaps/snap-avatar';
import {
  getOriginOfCurrentTab,
  getPermissionSubjects,
} from '../../../selectors';
import { removePermissionsFor, updateCaveat } from '../../../store/actions';
import { Display } from '../../../helpers/constants/design-system';

export default function ConnectedSnaps({ connectedSubjects }) {
  const [showOptions, setShowOptions] = useState(
    connectedSubjects.map(() => false),
  );
  const dispatch = useDispatch();
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);

  const ref = useRef(false);
  const t = useI18nContext();
  const history = useHistory();
  const subjects = useSelector((state) => getPermissionSubjects(state));

  const settingsClick = (id) => {
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(id)}`);
  };

  const onDisconnect = (snapId) => {
    const caveatValue =
      subjects[activeTabOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    console.log(caveatValue);
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    console.log(newCaveatValue, newCaveatValue[snapId]);
    if (Object.keys(newCaveatValue) > 0) {
      dispatch(
        updateCaveat(
          activeTabOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [activeTabOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
    }
  };

  return (
    <Box className="connected-sites-list__content-rows">
      {connectedSubjects.map((subject, index) => (
        <Box key={index} className="connected-sites-list__content-row">
          <Box className="connected-sites-list__subject-info" gap={2}>
            <SnapAvatar snapId={subject.origin} />
            <Text display={Display.Block} as="strong">
              {subject.name}
            </Text>
          </Box>
          <Box ref={ref}>
            <ButtonIcon
              iconName={IconName.MoreVertical}
              className="connected-accounts-options__button"
              onClick={() =>
                setShowOptions((prevState) => {
                  const newShowOptions = [...prevState];
                  newShowOptions[index] = true;
                  return newShowOptions;
                })
              }
              ariaLabel={t('options')}
            />
            {showOptions[index] ? (
              <Menu
                anchorElement={ref.current}
                onHide={() =>
                  setShowOptions((prevState) => {
                    const newShowOptions = [...prevState];
                    newShowOptions[index] = false;
                    return newShowOptions;
                  })
                }
                popperOptions={{
                  modifiers: [
                    { name: 'preventOverflow', options: { altBoundary: true } },
                  ],
                }}
              >
                <MenuItem
                  iconName={IconName.Logout}
                  onClick={() => onDisconnect(subject.origin)}
                >
                  {t('disconnect')} {subject.name}
                </MenuItem>
                <MenuItem
                  iconName={IconName.Setting}
                  onClick={() => settingsClick(subject.origin)}
                >
                  {t('snapsSettings')}
                </MenuItem>
              </Menu>
            ) : null}
          </Box>
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
