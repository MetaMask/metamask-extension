import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { ButtonIcon, IconName } from '../../component-library';
import { stripHttpsSchemeWithoutPort } from '../../../helpers/utils/util';
import SiteOrigin from '../../ui/site-origin';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Menu, MenuItem } from '../../ui/menu';
import { SNAPS_LIST_ROUTE } from '../../../helpers/constants/routes';
import SnapAvatar from '../snaps/snap-avatar';

export default function ConnectedSnaps({ connectedSubjects, onDisconnect }) {
  const [showOptions, setShowOptions] = useState(false);
  const ref = useRef(false);
  const t = useI18nContext();
  const history = useHistory();

  const getSubjectDisplayName = (subject) => {
    if (subject.extensionId) {
      return t('externalExtension');
    }

    // We strip https schemes only, and only if the URL has no port.
    return stripHttpsSchemeWithoutPort(subject.origin);
  };

  return (
    <main className="connected-sites-list__content-rows">
      {connectedSubjects.map((subject) => (
        <div key={subject.origin} className="connected-sites-list__content-row">
          <div className="connected-sites-list__subject-info">
            <SnapAvatar snapId={subject.origin} />
            <SiteOrigin
              className="connected-sites-list__subject-name"
              title={subject.extensionId || subject.origin}
              siteOrigin={getSubjectDisplayName(subject)}
            />
          </div>
          <div ref={ref}>
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
                  {t('disconnect')}
                </MenuItem>
                <MenuItem
                  iconName={IconName.Setting}
                  onClick={() => history.push(SNAPS_LIST_ROUTE)}
                >
                  {t('snapsSettings')}
                </MenuItem>
              </Menu>
            ) : null}
          </div>
        </div>
      ))}
    </main>
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
