import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  getAccountTypeForKeyring,
  getHardwareWalletType,
  getHDEntropyIndex,
  getIsSocialLoginFlow,
  isSolanaAccount,
} from '../../../selectors';
import {
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
import { getWalletIdAndNameByAccountAddress } from '../../../selectors/multichain-accounts/account-tree';
import { WalletMetadata } from '../../../selectors/multichain-accounts/account-tree.types';
import { KeyringType } from '../../../../shared/constants/keyring';
import { AccountRemoveModal } from '../../../components/multichain-accounts/account-remove-modal';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { formatAccountType } from '../../../helpers/utils/metrics';
import { PreferredAvatar } from '../../../components/app/preferred-avatar';

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
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getCurrentChainId);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const deviceName = useSelector(getHardwareWalletType);
  const socialLoginFlow = useSelector(getIsSocialLoginFlow);

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
    history.goBack();
  }, [history, dispatch]);

  // we can never have a scenario where an account is not associated with a wallet.
  const { id: walletId, name: walletName } = useSelector((state) =>
    getWalletIdAndNameByAccountAddress(state, address),
  ) as WalletMetadata;

  const walletRoute = `/wallet-details/${encodeURIComponent(walletId)}`;

  const isRemovable =
    account.metadata.keyring.type !== KeyringType.hdKeyTree &&
    !isSolanaAccount(account) &&
    !socialLoginFlow; // social login accounts are not removable

  const [showAccountRemoveModal, setShowAccountRemoveModal] = useState(false);

  const handleAccountRemoveAction = useCallback(() => {
    dispatch(removeAccount(account.address));

    trackEvent({
      event: MetaMetricsEventName.AccountRemoved,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_hardware_type: deviceName,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: accountType,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        <Box className="flex justify-center">
          <PreferredAvatar
            address={address}
            size={AvatarAccountSize.Xl}
            data-testid="avatar"
          />
        </Box>
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
                marginLeft={2}
              />
            }
            onClick={() => setIsEditingAccountName(true)}
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
                marginLeft={2}
                data-testid="account-address-navigation-button"
              />
            }
            onClick={handleShowAddress}
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
                marginLeft={2}
                data-testid="wallet-details-link"
              />
            }
            onClick={() => {
              history.push(walletRoute);
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
