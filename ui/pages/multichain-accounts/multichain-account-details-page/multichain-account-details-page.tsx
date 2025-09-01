import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletType } from '@metamask/account-api';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
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
} from '../../../selectors/multichain-accounts/account-tree';
import { extractWalletIdFromGroupId } from '../../../selectors/multichain-accounts/utils';
import {
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
} from '../../../helpers/constants/routes';

export const MultichainAccountDetailsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { id } = useParams();
  const accountGroupId = decodeURIComponent(id as string) as AccountGroupId;
  const multichainAccount = useSelector((state) =>
    getMultichainAccountGroupById(state, accountGroupId),
  );
  const walletId = extractWalletIdFromGroupId(accountGroupId);
  const wallet = useSelector((state) => getWallet(state, walletId));
  const walletRoute = `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/${encodeURIComponent(walletId)}`;
  const isRemovable =
    wallet?.type !== AccountWalletType.Entropy &&
    wallet?.type !== AccountWalletType.Snap;
  const addressCount = useSelector((state) =>
    getNetworkAddressCount(state, accountGroupId),
  );

  return (
    <Page className="multichain-account-details">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
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
        {t('accountDetails')}
      </Header>
      <Content
        className="multichain-account-details__content"
        paddingTop={3}
        gap={4}
      >
        <AvatarAccount
          address={accountGroupId}
          size={AvatarAccountSize.Xl}
          style={{ margin: '0 auto' }}
        />
        <Box className="multichain-account-details__section">
          <AccountDetailsRow
            label={t('accountName')}
            value={multichainAccount.metadata.name}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('accountName')}
                marginLeft={2}
                data-testid="account-name-action"
              />
            }
          />
          <AccountDetailsRow
            label={t('networks')}
            value={`${addressCount} ${addressCount > 1 ? t('addressesLabel') : t('addressLabel')}`}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('addresses')}
                marginLeft={2}
                data-testid="network-addresses-link"
                onClick={() => {
                  history.push(
                    `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`,
                  );
                }}
              />
            }
          />
          <AccountDetailsRow
            label={t('privateKeys')}
            value={t('unlockToReveal')}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('privateKeys')}
                marginLeft={2}
                data-testid="private-keys-action"
              />
            }
          />
          <AccountDetailsRow
            label={t('smartAccountLabel')}
            value={t('setUp')}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('smartAccountLabel')}
                marginLeft={2}
                data-testid="smart-account-action"
              />
            }
          />
        </Box>
        <Box className="multichain-account-details__section">
          <AccountDetailsRow
            label={t('wallet')}
            value={wallet.metadata.name}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('wallet')}
                marginLeft={2}
                data-testid="wallet-details-link"
              />
            }
            onClick={() => {
              history.push(walletRoute);
            }}
          />
          <AccountDetailsRow
            label={t('secretRecoveryPhrase')}
            value={t('accountDetailsSrpBackUpMessage')}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('accountDetailsSrpBackUpMessage')}
                marginLeft={2}
                data-testid="srp-backup-action"
              />
            }
          />
        </Box>
        {isRemovable && (
          <Box className="multichain-account-details__section">
            <AccountDetailsRow
              label={t('removeAccount')}
              labelColor={TextColor.errorDefault}
              value={''}
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
      </Content>
    </Page>
  );
};
