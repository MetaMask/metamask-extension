import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  Color,
  IconColor,
  JustifyContent,
  Size,
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
} from '../../component-library';
import Tooltip from '../../ui/tooltip';
import { getRequestingNetworkInfo } from '../../../selectors';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import { PermissionCellOptions } from './permission-cell-options';
import { PermissionCellStatus } from './permission-cell-status';

const PermissionCell = ({
  snapId,
  permissionName,
  title,
  description,
  weight,
  avatarIcon,
  dateApproved,
  revoked,
  approved,
  showOptions,
  hideStatus,
  accounts,
  chainIds,
  caipChainIds,
}) => {
  const infoIcon = IconName.Info;
  let infoIconColor = IconColor.iconMuted;
  let iconColor = IconColor.primaryDefault;
  let iconBackgroundColor = Color.primaryMuted;

  if (!revoked && weight <= 2) {
    iconColor = IconColor.warningDefault;
    iconBackgroundColor = Color.warningMuted;
    infoIconColor = IconColor.warningDefault;
  }

  if (dateApproved || approved) {
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

  // Get EVM network info from hex chain IDs (legacy fallback)
  const evmNetworksInfo = useSelector((state) =>
    getRequestingNetworkInfo(state, chainIds),
  );

  // Get all multichain network configurations (EVM and non-EVM) by CAIP chain ID
  const allMultichainNetworks = useSelector(
    getAllMultichainNetworkConfigurations,
  );

  // Get multichain network info from CAIP chain IDs (includes non-EVM networks)
  const multichainNetworksInfo = React.useMemo(() => {
    if (!caipChainIds || caipChainIds.length === 0) {
      return null; // Return null to indicate caipChainIds was not provided
    }
    return caipChainIds
      .map((caipChainId) => {
        const network = allMultichainNetworks[caipChainId];
        if (network) {
          return { ...network, caipChainId };
        }
        return null;
      })
      .filter(Boolean);
  }, [caipChainIds, allMultichainNetworks]);

  // Use multichain networks if caipChainIds was provided, otherwise fall back to EVM networks
  const networksInfo = React.useMemo(() => {
    // If caipChainIds was provided, use multichain networks exclusively
    if (multichainNetworksInfo !== null) {
      return multichainNetworksInfo;
    }
    // Fall back to EVM networks for legacy flows
    return evmNetworksInfo || [];
  }, [evmNetworksInfo, multichainNetworksInfo]);

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
          <PermissionCellStatus
            revoked={revoked}
            approved={approved}
            dateApproved={dateApproved}
            accounts={accounts}
            networks={networksInfo || null}
          />
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
  approved: PropTypes.bool,
  showOptions: PropTypes.bool,
  hideStatus: PropTypes.bool,
  accounts: PropTypes.array,
  chainIds: PropTypes.array,
  /** CAIP chain IDs for multichain display (e.g., 'solana:...') */
  caipChainIds: PropTypes.array,
};

export default PermissionCell;
