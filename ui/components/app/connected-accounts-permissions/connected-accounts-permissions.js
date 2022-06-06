import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import CheckBox from '../../ui/check-box';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissionDescription } from '../../../helpers/utils/permission';

const ConnectedAccountsPermissions = ({ permissions }) => {
  const t = useI18nContext();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((_expanded) => !_expanded);
  };

  if (!permissions.length) {
    return null;
  }

  return (
    <div className="connected-accounts-permissions">
      <p
        className="connected-accounts-permissions__header"
        onClick={toggleExpanded}
      >
        <strong>{t('permissions')}</strong>
        <button
          className={classnames('fas', {
            'fa-angle-down': !expanded,
            'fa-angle-up': expanded,
          })}
          title={t('showPermissions')}
        />
      </p>
      <div
        className={classnames(
          'connected-accounts-permissions__list-container',
          {
            'connected-accounts-permissions__list-container--expanded': expanded,
          },
        )}
      >
        <p>{t('authorizedPermissions')}:</p>
        <ul className="connected-accounts-permissions__list">
          {permissions.map(({ key: permissionName }) => (
            <li
              key={permissionName}
              className="connected-accounts-permissions__list-item"
            >
              <CheckBox
                checked
                disabled
                id={permissionName}
                className="connected-accounts-permissions__checkbox"
              />
              <label htmlFor={permissionName}>
                {getPermissionDescription(t, permissionName).label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

ConnectedAccountsPermissions.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    }),
  ),
};

ConnectedAccountsPermissions.defaultProps = {
  permissions: [],
};

ConnectedAccountsPermissions.displayName = 'ConnectedAccountsPermissions';

export default React.memo(ConnectedAccountsPermissions);
