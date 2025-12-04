import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
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
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainSrpBackup } from '../../../components/multichain-accounts/multichain-srp-backup';
import { useWalletInfo } from '../../../hooks/multichain-accounts/useWalletInfo';
import { MultichainAccountEditModal } from '../../../components/multichain-accounts/multichain-account-edit-modal';
import { AccountRemoveModal } from '../../../components/multichain-accounts/account-remove-modal';
import { removeAccount } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { trace, TraceName, TraceOperation } from '../../../../shared/lib/trace';

export const MultichainAccountDetailsPage = ({
  id: idProp,
}: { id?: string } = {}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { id: idFromParams } = useParams();

  // Use prop if provided (from createV5CompatRoute), otherwise fall back to hook
  const id = idProp || idFromParams;

  const accountGroupId = decodeURIComponent(id ?? '') as AccountGroupId;
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
    trace({
      name: TraceName.ShowAccountAddressList,
      op: TraceOperation.AccountUi,
    });
    navigate(
      `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`,
    );
  };

  const handlePrivateKeysClick = () => {
    navigate(
      `${MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`,
    );
  };

  const handleSmartAccountClick = () => {
    const evmAccountAddress = evmInternalAccount?.address;
    if (evmAccountAddress) {
      navigate(
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

      navigate(DEFAULT_ROUTE);
    }
  }, [dispatch, trackEvent, navigate, wallet?.type, accountsWithAddresses]);

  const handleWalletAction = () => {
    navigate(walletRoute);
  };

  useEffect(() => {
    // Redirect if account doesn't exist
    if (!id || !multichainAccount) {
      navigate(DEFAULT_ROUTE);
    }
  }, [id, multichainAccount, navigate]);

  return id && multichainAccount ? (
    <Page className="multichain-account-details-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
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
        <Box className="flex justify-center" paddingBottom={6}>
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
  ) : null;
};
