import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getSnapRoute } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getOriginOfCurrentTab } from '../../../selectors';
import { disconnectOriginFromSnap } from '../../../store/actions';
import { Box, IconName, IconSize, Text } from '../../component-library';
import { MenuItem } from '../../ui/menu';
import ConnectedAccountsListOptions from '../connected-accounts-list/connected-accounts-list-options';
import { SnapIcon } from '../snaps/snap-icon';

export default function ConnectedSnaps({ connectedSubjects }) {
  const [showOptions, setShowOptions] = useState();
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const connectedOrigin = useSelector(getOriginOfCurrentTab);

  const onDisconnect = (snapId) => {
    dispatch(disconnectOriginFromSnap(connectedOrigin, snapId));
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
          onClick={() => history.push(getSnapRoute(snapId))}
        >
          {t('snapsSettings')}
        </MenuItem>
      </ConnectedAccountsListOptions>
    );
  };

  return (
    <Box className="connected-snaps-list__content-rows" width={BlockSize.Full}>
      {connectedSubjects.map((subject) => (
        <Box
          key={subject.origin}
          className="connected-snaps-list__content-row"
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          padding={4}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            className="connected-snaps-list__subject-info"
            gap={4}
            display={Display.Flex}
            alignItems={AlignItems.center}
          >
            <SnapIcon snapId={subject.origin} avatarSize={IconSize.Md} />
            <Text
              variant={TextVariant.bodyLgMedium}
              className="connected-accounts-list__account-name"
            >
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
  /**
   * Shape of ConnectedSnaps
   */
  connectedSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      /**
       * It should have a name for Snap
       */
      name: PropTypes.string,
      /**
       * Origin of connected subject, in case of snaps it's snapId
       */
      origin: PropTypes.string,
    }),
  ).isRequired,
};
