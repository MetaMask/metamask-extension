import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
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
  AvatarAccount,
  AvatarAccountSize,
  AvatarIcon,
  AvatarIconSize,
  Box,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { EditAccountsModal, EditNetworksModal } from '../../..';
import { getPermittedAccountsByOrigin } from '../../../../../selectors/permissions';
import { SiteCellTooltip } from './site-cell-tooltip';

type SiteCellProps = {
  networks: {
    rpcPrefs?: { imageUrl?: string };
    nickname: string;
    chainId?: string;
  }[];
  accounts: {
    address: string;
    label: string;
    metadata: {
      name: string;
    };
  }[];
  onAccountsClick: () => void;
  onNetworksClick: () => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setSelectedChainIds: (chainIds: string[]) => void;
  onDisconnectClick: () => void;
  selectedAccounts: string[];
  selectedChainIds: string[];
  activeTabOrigin: string;
  combinedNetworks;
};

export const SiteCell: React.FC<SiteCellProps> = ({
  networks,
  accounts,
  onAccountsClick,
  onNetworksClick,
  selectedAccounts,
  setSelectedAccounts,
  selectedChainIds,
  setSelectedChainIds,
  activeTabOrigin,
  combinedNetworks,
  onDisconnectClick,
}) => {
  const t = useI18nContext();
  const avatarNetworksData = networks.map((network) => ({
    avatarValue: network?.rpcPrefs?.imageUrl || '',
    symbol: network.nickname,
  }));
  const avatarAccountsData = accounts.map((account) => ({
    avatarValue: account.address,
  }));

  const [showEditAccountsModal, setShowEditAccountsModal] = useState(false);
  const [showEditNetworksModal, setShowEditNetworksModal] = useState(false);
  const accountMessageConnectedState =
    accounts.length > 1
      ? t('connectedWith')
      : t('connectedWithAccount', [
          accounts[0].label || accounts[0].metadata.name,
        ]);
  const accountMessageNotConnectedState =
    accounts.length > 1
      ? t('requestingFor')
      : t('requestingForAccount', [
          accounts[0].label || accounts[0].metadata.name,
        ]);

  const permittedAccountsByOrigin = useSelector(getPermittedAccountsByOrigin);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[activeTabOrigin]?.length;

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
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Wallet}
          size={AvatarIconSize.Md}
          iconProps={{ size: IconSize.Sm }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: 1 }}
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
              ellipsis
            >
              {currentTabHasNoAccounts
                ? accountMessageNotConnectedState
                : accountMessageConnectedState}
            </Text>
            {accounts.length > 1 ? (
              <SiteCellTooltip
                accounts={accounts}
                avatarAccountsData={avatarAccountsData}
              />
            ) : (
              <AvatarAccount
                address={accounts[0].address}
                size={AvatarAccountSize.Xs}
                borderColor={BorderColor.transparent}
              />
            )}
          </Box>
        </Box>
        {currentTabHasNoAccounts ? (
          <ButtonLink onClick={() => setShowEditAccountsModal(true)}>
            {t('edit')}
          </ButtonLink>
        ) : (
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            alignItems={AlignItems.center}
            style={{ flex: 1, alignSelf: 'center' }}
            gap={2}
            onClick={() => setShowEditAccountsModal(true)}
          >
            <Icon
              display={Display.Flex}
              name={IconName.MoreVertical}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
              backgroundColor={BackgroundColor.backgroundDefault}
            />
          </Box>
        )}
      </Box>

      <Box
        data-testid="connection-list-item"
        as="button"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Data}
          size={AvatarIconSize.Md}
          iconProps={{ size: IconSize.Sm }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: 1 }}
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
              {currentTabHasNoAccounts
                ? t('requestingFor')
                : t('connectedWith')}
            </Text>
            <SiteCellTooltip
              networks={networks}
              avatarNetworksData={avatarNetworksData}
            />
          </Box>
        </Box>
        {currentTabHasNoAccounts ? (
          <ButtonLink onClick={() => setShowEditNetworksModal(true)}>
            {t('edit')}
          </ButtonLink>
        ) : (
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            alignItems={AlignItems.center}
            style={{ flex: 1, alignSelf: 'center' }}
            gap={2}
            onClick={() => setShowEditNetworksModal(true)}
          >
            <Icon
              display={Display.Flex}
              name={IconName.MoreVertical}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
              backgroundColor={BackgroundColor.backgroundDefault}
            />
          </Box>
        )}
      </Box>

      {showEditNetworksModal && (
        <EditNetworksModal
          onClose={() => setShowEditNetworksModal(false)}
          onClick={onNetworksClick}
          selectedChainIds={selectedChainIds}
          setSelectedChainIds={setSelectedChainIds}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
          combinedNetworks={combinedNetworks}
          onDisconnectClick={onDisconnectClick}
        />
      )}

      {showEditAccountsModal && (
        <EditAccountsModal
          onClose={() => setShowEditAccountsModal(false)}
          onClick={onAccountsClick}
          selectedAccounts={selectedAccounts}
          setSelectedAccounts={setSelectedAccounts}
          activeTabOrigin={activeTabOrigin}
          currentTabHasNoAccounts={currentTabHasNoAccounts}
          onDisconnectClick={onDisconnectClick}
        />
      )}
    </>
  );
};
