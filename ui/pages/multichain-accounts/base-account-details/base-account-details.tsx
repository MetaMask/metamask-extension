import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getAccountTypeForKeyring,
  getHardwareWalletType,
  getHDEntropyIndex,
  getUseBlockie,
  isSolanaAccount,
} from '../../../selectors';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  ACCOUNT_DETAILS_QR_CODE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { IconName } from '../../../components/component-library/icon';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountDetailsRow } from '../../../components/multichain-accounts/account-details-row';
import { EditAccountNameModal } from '../../../components/multichain-accounts/edit-account-name-modal';
import {
  removeAccount,
  setAccountDetailsAddress,
} from '../../../store/actions';
import {
  getWalletIdAndNameByAccountAddress,
  WalletMetadata,
} from '../../../selectors/multichain-accounts/account-tree';
import { KeyringType } from '../../../../shared/constants/keyring';
import { AccountRemoveModal } from '../../../components/multichain-accounts/account-remove-modal';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { formatAccountType } from '../../../helpers/utils/metrics';

type BaseAccountDetailsProps = {
  children?: React.ReactNode | React.ReactNode[];
  account: InternalAccount;
  address: string;
};

export const BaseAccountDetails = ({
  children,
  account,
  address,
}: BaseAccountDetailsProps) => {
  const useBlockie = useSelector(getUseBlockie);
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getCurrentChainId);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const deviceName = useSelector(getHardwareWalletType);

  const {
    metadata: { name },
    type,
  } = account;
  const formattedAddress = isEvmAccountType(type)
    ? toChecksumHexAddress(address as string)?.toLowerCase()
    : address;
  const shortenedAddress = shortenAddress(formattedAddress);

  const [isEditingAccountName, setIsEditingAccountName] = useState(false);

  const handleShowAddress = () => {
    history.push(`${ACCOUNT_DETAILS_QR_CODE_ROUTE}/${address}`);
  };

  const { keyring } = account.metadata;
  const accountType = formatAccountType(getAccountTypeForKeyring(keyring));

  const handleNavigation = useCallback(() => {
    dispatch(setAccountDetailsAddress(''));
    history.push(DEFAULT_ROUTE);
  }, [history, dispatch]);

  // we can never have a scenario where an account is not associated with a wallet.
  const { id: walletId, name: walletName } = useSelector((state) =>
    getWalletIdAndNameByAccountAddress(state, address),
  ) as WalletMetadata;

  const walletRoute = `/wallet-details/${encodeURIComponent(walletId)}`;

  const isRemovable =
    account.metadata.keyring.type !== KeyringType.hdKeyTree &&
    !isSolanaAccount(account);

  const [showAccountRemoveModal, setShowAccountRemoveModal] = useState(false);

  const handleAccountRemoveAction = useCallback(() => {
    dispatch(removeAccount(account.address));

    trackEvent({
      event: MetaMetricsEventName.AccountRemoved,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        account_hardware_type: deviceName,
        chain_id: chainId,
        account_type: accountType,
        hd_entropy_index: hdEntropyIndex,
        caip_chain_id: formatChainIdToCaip(chainId),
      },
    });

    dispatch(setAccountDetailsAddress(''));
    history.push(DEFAULT_ROUTE);
  }, [
    dispatch,
    account.address,
    trackEvent,
    deviceName,
    chainId,
    accountType,
    hdEntropyIndex,
    history,
  ]);

  return (
    <Page
      backgroundColor={BackgroundColor.backgroundDefault}
      className="multichain-account-details-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={handleNavigation}
          />
        }
      >
        {name}
      </Header>
      <Content paddingTop={3} gap={4}>
        <AvatarAccount
          address={address}
          variant={
            useBlockie
              ? AvatarAccountVariant.Blockies
              : AvatarAccountVariant.Jazzicon
          }
          size={AvatarAccountSize.Xl}
          style={{ margin: '0 auto', marginBottom: '32px' }}
        />
        <Box className="multichain-account-details__section">
          <AccountDetailsRow
            label={t('accountName')}
            value={name}
            endAccessory={
              <ButtonIcon
                iconName={IconName.Edit}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('edit')}
                onClick={() => setIsEditingAccountName(true)}
                marginLeft={2}
              />
            }
            style={{
              marginBottom: '1px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          />
          <AccountDetailsRow
            label={t('address')}
            value={shortenedAddress}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('next')}
                onClick={handleShowAddress}
                marginLeft={2}
              />
            }
            style={{
              marginBottom: '1px',
            }}
          />
          <AccountDetailsRow
            label={t('wallet')}
            value={walletName}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('next')}
                onClick={() => {
                  history.push(walletRoute);
                }}
                marginLeft={2}
              />
            }
            style={{
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />
        </Box>
        {children}
        {isRemovable && (
          <Box className="multichain-account-details__remove_account_section">
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Full}
              variant={ButtonVariant.Secondary}
              danger={true}
              onClick={() => setShowAccountRemoveModal(true)}
            >
              {t('removeAccount')}
            </Button>
          </Box>
        )}
        {isEditingAccountName && (
          <EditAccountNameModal
            isOpen={isEditingAccountName}
            onClose={() => setIsEditingAccountName(false)}
            currentAccountName={name}
            address={address}
          />
        )}
        {showAccountRemoveModal && (
          <AccountRemoveModal
            isOpen={showAccountRemoveModal}
            onClose={() => setShowAccountRemoveModal(false)}
            onSubmit={handleAccountRemoveAction}
            accountName={account.metadata.name}
            accountAddress={account.address}
          />
        )}
      </Content>
    </Page>
  );
};
