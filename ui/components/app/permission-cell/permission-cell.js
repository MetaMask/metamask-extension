import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  AlignItems,
  BorderColor,
  Color,
  IconColor,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
  Display,
  BlockSize,
  FlexWrap,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
  Box,
  AvatarTokenSize,
  AvatarAccount,
  AvatarAccountSize,
} from '../../component-library';
import { formatDate } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip';
import { AvatarGroup } from '../../multichain';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
import { PermissionCellOptions } from './permission-cell-options';

const PermissionCell = ({
  snapId,
  permissionName,
  title,
  description,
  weight,
  avatarIcon,
  dateApproved,
  revoked,
  showOptions,
  hideStatus,
  accounts,
}) => {
  const t = useI18nContext();

  const infoIcon = IconName.Info;
  let infoIconColor = IconColor.iconMuted;
  let iconColor = IconColor.primaryDefault;
  let iconBackgroundColor = Color.primaryMuted;

  if (!revoked && weight <= 2) {
    iconColor = IconColor.warningDefault;
    iconBackgroundColor = Color.warningMuted;
    infoIconColor = IconColor.warningDefault;
  }

  if (dateApproved) {
    iconColor = IconColor.iconMuted;
    iconBackgroundColor = Color.backgroundAlternative;
  }

  if (revoked) {
    iconColor = IconColor.iconMuted;
    iconBackgroundColor = Color.backgroundAlternative;
  }

  let permissionIcon = avatarIcon;
  if (typeof avatarIcon !== 'string' && avatarIcon?.props?.iconName) {
    permissionIcon = avatarIcon.props.iconName;
  }

  const renderAccountsGroup = () => (
    <Box
      as="span"
      className="permission-cell__accounts-group-box"
      display={Display.InlineFlex}
    >
      <Tooltip
        position="bottom"
        html={
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.headingSm}
              color={TextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              {t('accounts')}
            </Text>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              {accounts.map((account, index) => (
                <Box
                  key={`${account.avatarValue}_${index}`}
                  display={Display.Flex}
                  justifyContent={JustifyContent.flexStart}
                  alignItems={AlignItems.center}
                  marginTop={2}
                >
                  <AvatarAccount
                    address={account.avatarValue}
                    size={AvatarAccountSize.Xs}
                    borderColor={BorderColor.backgroundDefault}
                  />
                  <Text variant={TextVariant.bodyMdMedium} marginLeft={2}>
                    {account.avatarName}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        }
      >
        <AvatarGroup
          limit={3}
          members={accounts}
          avatarType={AvatarType.ACCOUNT}
          size={AvatarTokenSize.Xs}
          width={BlockSize.Min}
          borderColor={BorderColor.backgroundDefault}
          marginLeft={4}
          paddingLeft={4}
        />
      </Tooltip>
    </Box>
  );

  let accountGroup = '';
  let statusRequestedTranslation = 'permissionRequested';
  let statusApprovedTranslation = 'approvedOn';
  let statusRevokedTranslation = 'permissionRevoked';
  if (accounts && accounts.length) {
    accountGroup = renderAccountsGroup();
    statusRequestedTranslation = 'permissionRequestedForAccounts';
    statusApprovedTranslation = 'approvedOnForAccounts';
    statusRevokedTranslation = 'permissionRevokedForAccounts';
  }

  return (
    <Box
      className="permission-cell"
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.flexStart}
      paddingTop={2}
      paddingBottom={2}
    >
      <Box display={Display.Flex}>
        {typeof permissionIcon === 'string' ? (
          <AvatarIcon
            iconName={permissionIcon}
            size={AvatarIconSize.Md}
            iconProps={{
              size: IconSize.Sm,
            }}
            color={iconColor}
            backgroundColor={iconBackgroundColor}
          />
        ) : (
          permissionIcon
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexWrap={FlexWrap.Wrap}
        flexDirection={FlexDirection.Column}
        width={BlockSize.Full}
        marginLeft={4}
        marginRight={4}
      >
        <Text
          size={Size.MD}
          variant={TextVariant.bodyMd}
          className={classnames('permission-cell__title', {
            'permission-cell__title-revoked': revoked,
          })}
        >
          {title}
        </Text>
        {!hideStatus && (
          <Text
            className="permission-cell__status"
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            display={Display.Flex}
          >
            {!revoked &&
              (dateApproved
                ? t(statusApprovedTranslation, [
                    formatDate(dateApproved, 'yyyy-MM-dd'),
                    accountGroup,
                  ])
                : t(statusRequestedTranslation, [accountGroup]))}
            {revoked ? t(statusRevokedTranslation, [accountGroup]) : ''}
          </Text>
        )}
      </Box>
      <Box display={Display.Flex}>
        {showOptions && snapId ? (
          <PermissionCellOptions
            snapId={snapId}
            permissionName={permissionName}
            description={description}
          />
        ) : (
          description && (
            <Tooltip
              html={
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {description}
                </Text>
              }
              position="bottom"
            >
              <Icon color={infoIconColor} name={infoIcon} size={IconSize.Sm} />
            </Tooltip>
          )
        )}
      </Box>
    </Box>
  );
};

PermissionCell.propTypes = {
  snapId: PropTypes.string,
  permissionName: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
    .isRequired,
  title: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired,
  ]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  weight: PropTypes.number,
  avatarIcon: PropTypes.any.isRequired,
  dateApproved: PropTypes.number,
  revoked: PropTypes.bool,
  showOptions: PropTypes.bool,
  hideStatus: PropTypes.bool,
  accounts: PropTypes.array,
};

export default PermissionCell;
