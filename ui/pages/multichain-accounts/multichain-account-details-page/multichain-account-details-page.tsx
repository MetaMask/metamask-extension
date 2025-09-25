import React, { useCallback, useContext, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletType } from '@metamask/account-api';
import classnames from 'classnames';
import { AvatarAccountSize } from '@metamask/design-system-react';

import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import { PreferredAvatar } from '../../../components/app/preferred-avatar';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountDetailsRow } from '../../../components/multichain-accounts/account-details-row';
import {
  getMultichainAccountGroupById,
  getNetworkAddressCount,
  getWallet,
  getIconSeedAddressByAccountGroupId,
  getInternalAccountByGroupAndCaip,
  getInternalAccountsFromGroupById,
} from '../../../selectors/multichain-accounts/account-tree';
import { extractWalletIdFromGroupId } from '../../../selectors/multichain-accounts/utils';
import {
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE,
  MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainSrpBackup } from '../../../components/multichain-accounts/multichain-srp-backup';
import { useWalletInfo } from '../../../hooks/multichain-accounts/useWalletInfo';
import { MultichainAccountEditModal } from '../../../components/multichain-accounts/multichain-account-edit-modal';
import { AccountRemoveModal } from '../../../components/multichain-accounts/account-remove-modal';
import {
  removeAccount,
  setAccountDetailsAddress,
} from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export const MultichainAccountDetailsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { id } = useParams();
  const accountGroupId = decodeURIComponent(id as string) as AccountGroupId;
  const multichainAccount = useSelector((state) =>
    getMultichainAccountGroupById(state, accountGroupId),
  );
  const walletId = extractWalletIdFromGroupId(accountGroupId);
  const wallet = useSelector((state) => getWallet(state, walletId));
  const { keyringId, isSRPBackedUp } = useWalletInfo(walletId);
  const walletRoute = `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/${encodeURIComponent(walletId)}`;
  const isRemovable =
    wallet?.type !== AccountWalletType.Entropy &&
    wallet?.type !== AccountWalletType.Snap;
  const addressCount = useSelector((state) =>
    getNetworkAddressCount(state, accountGroupId),
  );
  const accountsWithAddresses = useSelector((state) =>
    getInternalAccountsFromGroupById(state, accountGroupId),
  );
  const evmInternalAccount = useSelector((state) =>
    getInternalAccountByGroupAndCaip(state, accountGroupId, 'eip155:1'),
  );
  const seedAddressIcon = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(state, accountGroupId),
  );
  const [isAccountRenameModalOpen, setIsAccountRenameModalOpen] =
    useState(false);
  const [isAccountRemoveModalOpen, setIsAccountRemoveModalOpen] =
    useState(false);

  const isEntropyWallet = wallet?.type === AccountWalletType.Entropy;
  const isPrivateKeyWallet = accountsWithAddresses.some(
    (account) => account.metadata.keyring.type === KeyringTypes.simple,
  );
  const shouldShowBackupReminder = isSRPBackedUp === false;

  const handleAddressesClick = () => {
    history.push(
      `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`,
    );
  };

  const handlePrivateKeysClick = () => {
    history.push(
      `${MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`,
    );
  };

  const handleSmartAccountClick = () => {
    const evmAccountAddress = evmInternalAccount?.address;
    if (evmAccountAddress) {
      history.push(
        `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/${encodeURIComponent(evmAccountAddress)}`,
      );
    }
  };

  const handleAccountNameAction = () => {
    setIsAccountRenameModalOpen(true);
  };

  const handleAccountRemoveAction = useCallback(() => {
    const firstAccountAddress = accountsWithAddresses[0]?.address;
    if (firstAccountAddress) {
      // Don't want to blindly call removeAccount without an invalid or empty parameter
      dispatch(removeAccount(firstAccountAddress));
      trackEvent({
        event: MetaMetricsEventName.AccountRemoved,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: wallet?.type,
        },
      });

      dispatch(setAccountDetailsAddress(''));
      history.push(DEFAULT_ROUTE);
    }
  }, [dispatch, trackEvent, history, wallet?.type, accountsWithAddresses]);

  const handleWalletAction = () => {
    history.push(walletRoute);
  };

  return (
    <Page className="multichain-account-details-page">
      <Header
        textProps={{
          variant: TextVariant.headingMd,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
            data-testid="back-button"
          />
        }
      >
        {multichainAccount.metadata.name}
      </Header>
      <Content
        className="multichain-account-details-page__content"
        paddingTop={3}
        gap={4}
      >
        <Box className="flex justify-center">
          <PreferredAvatar
            address={seedAddressIcon}
            size={AvatarAccountSize.Xl}
            data-testid="avatar"
          />
        </Box>
        <Box className="multichain-account-details-page__section">
          <AccountDetailsRow
            label={t('accountName')}
            value={multichainAccount.metadata.name}
            onClick={handleAccountNameAction}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Sm}
                ariaLabel={t('accountName')}
                marginLeft={2}
                data-testid="account-name-action"
              />
            }
          />
          <AccountDetailsRow
            label={t('networks')}
            value={`${addressCount} ${addressCount > 1 ? t('addressesLabel') : t('addressLabel')}`}
            onClick={handleAddressesClick}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Sm}
                ariaLabel={t('addresses')}
                marginLeft={2}
                data-testid="network-addresses-link"
              />
            }
          />
          {(isEntropyWallet || isPrivateKeyWallet) && (
            <AccountDetailsRow
              label={t('privateKeys')}
              value={t('unlockToReveal')}
              onClick={handlePrivateKeysClick}
              endAccessory={
                <ButtonIcon
                  iconName={IconName.ArrowRight}
                  color={IconColor.iconAlternative}
                  size={ButtonIconSize.Sm}
                  ariaLabel={t('privateKeys')}
                  marginLeft={2}
                  data-testid="private-keys-action"
                />
              }
            />
          )}
          <AccountDetailsRow
            label={t('smartAccountLabel')}
            value={t('setUp')}
            onClick={handleSmartAccountClick}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Sm}
                ariaLabel={t('smartAccountLabel')}
                marginLeft={2}
                data-testid="smart-account-action"
              />
            }
          />
        </Box>
        <Box className="multichain-account-details-page__section">
          <AccountDetailsRow
            label={t('wallet')}
            value={wallet.metadata.name}
            onClick={handleWalletAction}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Sm}
                ariaLabel={t('wallet')}
                marginLeft={2}
                data-testid="wallet-details-link"
              />
            }
          />
          {isEntropyWallet ? (
            <MultichainSrpBackup
              className={classnames(
                'multichain-account-details__row',
                'multichain-account-details-page__srp-button',
              )}
              shouldShowBackupReminder={shouldShowBackupReminder}
              keyringId={keyringId}
            />
          ) : null}
        </Box>
        {isRemovable && (
          <Box className="multichain-account-details-page__section">
            <AccountDetailsRow
              label={t('removeAccount')}
              labelColor={TextColor.errorDefault}
              value={''}
              onClick={() => setIsAccountRemoveModalOpen(true)}
              endAccessory={
                <ButtonIcon
                  iconName={IconName.ArrowRight}
                  color={IconColor.iconAlternative}
                  size={ButtonIconSize.Md}
                  ariaLabel={t('removeAccount')}
                  marginLeft={2}
                  data-testid="account-remove-action"
                />
              }
            />
          </Box>
        )}
        {isAccountRenameModalOpen && (
          <MultichainAccountEditModal
            isOpen={isAccountRenameModalOpen}
            onClose={() => setIsAccountRenameModalOpen(false)}
            accountGroupId={multichainAccount.id}
          />
        )}
        {isAccountRemoveModalOpen && (
          <AccountRemoveModal
            isOpen={isAccountRemoveModalOpen}
            onClose={() => setIsAccountRemoveModalOpen(false)}
            onSubmit={handleAccountRemoveAction}
            accountName={multichainAccount.metadata.name}
            accountAddress={accountsWithAddresses[0]?.address}
          />
        )}
      </Content>
    </Page>
  );
};
