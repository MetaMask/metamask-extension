import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { AvatarGroup, EditAccountsModal, EditNetworksModal } from '../../..';
import { AvatarType } from '../../../avatar-group/avatar-group.types';
import { useSelector } from 'react-redux';
import { getPermittedAccountsByOrigin } from '../../../../../selectors/permissions';

export const SiteCell = ({
  networks,
  accounts,
  onAccountsClick,
  onNetworksClick,
  selectNewAccountViaModal,
  selectAll,
  handleAccountClick,
  approvedAccounts,
  activeTabOrigin,
}) => {
  const t = useI18nContext();
  const avatarNetworksData = networks.map(
    (network: { rpcPrefs?: { imageUrl?: string }; nickname: string }) => ({
      avatarValue: network?.rpcPrefs?.imageUrl || '', // Fall back to empty string if imageUrl is undefined or null
      symbol: network.nickname,
    }),
  );
  const avatarAccountsData = accounts.map((account: { address: string }) => ({
    avatarValue: account.address,
  }));
  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);
  const permittedAccountsByOrigin = useSelector(
    getPermittedAccountsByOrigin,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as { [key: string]: any[] };
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;
  console.log(currentTabHasNoAccounts);
  return (
    <>
      <Box
        data-testid="connection-list-item"
        as="button"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        // onClick={onClick}
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Wallet}
          size={AvatarIconSize.Md}
          iconProps={{
            size: IconSize.Sm,
          }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: '1' }}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {t('accountsPermissionsTitle')}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('connectedWith')}
            </Text>
            <AvatarGroup
              avatarType={AvatarType.ACCOUNT}
              members={avatarAccountsData}
              limit={4}
            />
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          onClick={() => {
            setShowEditAccountsModal(true);
          }}
        >
          <Icon
            display={Display.Flex}
            name={IconName.MoreVertical}
            color={IconColor.iconDefault}
            size={IconSize.Sm}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        </Box>
      </Box>
      <Box
        data-testid="connection-list-item"
        as="button"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        // onClick={onClick}
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Data}
          size={AvatarIconSize.Md}
          iconProps={{
            size: IconSize.Sm,
          }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: '1' }}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {t('permission_walletSwitchEthereumChain')}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('connectedWith')}
            </Text>
            <AvatarGroup
              avatarType={AvatarType.TOKEN}
              members={avatarNetworksData}
              limit={4}
            />
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          onClick={() => {
            setShowEditNetworksModal(true);
          }}
        >
          <Icon
            display={Display.Flex}
            name={IconName.MoreVertical}
            color={IconColor.iconDefault}
            size={IconSize.Sm}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        </Box>
      </Box>
      {showEditNetworksModal ? (
        <EditNetworksModal
          onClose={() => setShowEditNetworksModal(false)}
          onClick={onNetworksClick}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
        />
      ) : null}
      {showEditAccountsModal ? (
        <EditAccountsModal
          onClose={() => setShowEditAccountsModal(false)}
          onClick={onAccountsClick}
          selAccounts={accounts}
          approvedAccounts={approvedAccounts}
          activeTabOrigin={activeTabOrigin}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
        />
      ) : null}
    </>
  );
};

SiteCell.propTypes = {
  /**
   * The connection data to display
   */
  connection: PropTypes.object.isRequired,
  /**
   * The function to call when the connection is clicked
   */
  onClick: PropTypes.func.isRequired,
};
