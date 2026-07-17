import classnames from 'clsx';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { flatten } from 'lodash';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  Checkbox,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import {
  BlockSize,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getSnapName } from '../../../helpers/utils/util';
import { getSnapsMetadata } from '../../../selectors';

const ConnectedAccountsPermissions = ({ permissions }) => {
  const t = useI18nContext();
  const [expanded, setExpanded] = useState(false);
  const snapsMetadata = useSelector(getSnapsMetadata);

  const toggleExpanded = () => {
    setExpanded((_expanded) => !_expanded);
  };

  if (!permissions?.length) {
    return null;
  }

  const permissionLabels = flatten(
    permissions.map(({ key, value }) =>
      getPermissionDescription({
        t,
        permissionName: key,
        permissionValue: value,
        getSubjectName: getSnapName(snapsMetadata),
      }),
    ),
  );

  return (
    <Box className="connected-accounts-permissions" width={BlockSize.Full}>
      <Box
        className="flex connected-accounts-permissions__header"
        flexDirection={BoxFlexDirection.Row}
        asChild
        width={BlockSize.Full}
        justifyContent={BoxJustifyContent.Between}
        padding={0}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
      >
        <button onClick={toggleExpanded}>
          <Text as="h6" variant={TextVariant.bodyMdMedium}>
            {t('permissions')}
          </Text>

          <ButtonIcon
            size={ButtonIconSize.Sm}
            iconName={expanded ? IconName.ArrowUp : IconName.ArrowDown}
            ariaLabel={t('showPermissions')}
          />
        </button>
      </Box>
      {expanded ? (
        <Box
          className={classnames(
            'connected-accounts-permissions__list-container-expanded',
          )}
          marginTop={4}
          data-testid="connected-accounts-permissions-list"
        >
          <Text as="h6" variant={TextVariant.bodySm}>
            {t('authorizedPermissions')}:
          </Text>
          <ul className="connected-accounts-permissions__list">
            {permissionLabels.map(({ label }, idx) => (
              <li
                key={`connected-permission-${idx}`}
                className="connected-accounts-permissions__list-item"
              >
                <Checkbox
                  isChecked
                  isDisabled
                  id={`connected-permission-${idx}`}
                  label={label}
                />
              </li>
            ))}
          </ul>
        </Box>
      ) : null}
    </Box>
  );
};

ConnectedAccountsPermissions.propTypes = {
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    }),
  ),
};

ConnectedAccountsPermissions.displayName = 'ConnectedAccountsPermissions';

export default React.memo(ConnectedAccountsPermissions);
