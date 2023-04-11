import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { flatten } from 'lodash';
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

  const permissionLabels = flatten(
    permissions.map(({ key, value }) =>
      getPermissionDescription({
        t,
        permissionName: key,
        permissionValue: value,
      }),
    ),
  );

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
            'connected-accounts-permissions__list-container--expanded':
              expanded,
          },
        )}
      >
        <p>{t('authorizedPermissions')}:</p>
        <ul className="connected-accounts-permissions__list">
          {permissionLabels.map(({ label }, idx) => (
            <li
              key={`connected-permission-${idx}`}
              className="connected-accounts-permissions__list-item"
            >
              <CheckBox
                checked
                disabled
                id={`connected-permission-${idx}`}
                className="connected-accounts-permissions__checkbox"
              />
              <label htmlFor={`connected-permission-${idx}`}>{label}</label>
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
