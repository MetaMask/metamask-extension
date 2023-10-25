import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { flatten } from 'lodash';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Checkbox,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getPermissionDescription } from '../../../helpers/utils/permission';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

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
    <Box className="connected-accounts-permissions" width={BlockSize.Full}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        as="button"
        onClick={toggleExpanded}
        width={BlockSize.Full}
        justifyContent={JustifyContent.spaceBetween}
        className="connected-accounts-permissions__header"
        padding={0}
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        <Text
          onClick={toggleExpanded}
          as="h6"
          variant={TextVariant.bodyMdMedium}
        >
          {t('permissions')}
        </Text>

        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={expanded ? IconName.ArrowUp : IconName.ArrowDown}
          ariaLabel={t('showPermissions')}
        />
      </Box>
      {expanded ? (
        <Box
          className={classnames(
            'connected-accounts-permissions__list-container-expanded',
          )}
          marginTop={4}
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

ConnectedAccountsPermissions.defaultProps = {
  permissions: [],
};

ConnectedAccountsPermissions.displayName = 'ConnectedAccountsPermissions';

export default React.memo(ConnectedAccountsPermissions);
