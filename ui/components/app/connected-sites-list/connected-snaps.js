import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Box, ButtonIcon, IconName, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Menu, MenuItem } from '../../ui/menu';
import { SNAPS_VIEW_ROUTE } from '../../../helpers/constants/routes';
import SnapAvatar from '../snaps/snap-avatar';
import { Display } from '../../../helpers/constants/design-system';

export default function ConnectedSnaps({ connectedSubjects, onDisconnect }) {
  const [showOptions, setShowOptions] = useState(false);
  const ref = useRef(false);
  const t = useI18nContext();
  const history = useHistory();

  const settingsClick = (id) => {
    history.push(`${SNAPS_VIEW_ROUTE}/${encodeURIComponent(id)}`);
  };

  return (
    <Box className="connected-sites-list__content-rows">
      {connectedSubjects.map((subject) => (
        <Box key={subject.origin} className="connected-sites-list__content-row">
          <Box className="connected-sites-list__subject-info">
            <SnapAvatar snapId={subject.origin} />
            <Text display={Display.Block} as="strong">
              {subject.name}
            </Text>
          </Box>
          <Box ref={ref}>
            <ButtonIcon
              iconName={IconName.MoreVertical}
              className="connected-accounts-options__button"
              onClick={() => setShowOptions(true)}
              ariaLabel={t('options')}
            />
            {showOptions ? (
              <Menu
                anchorElement={ref.current}
                onHide={() => setShowOptions(false)}
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
                  {subject.origin}
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
  onDisconnect: PropTypes.func.isRequired,
};
