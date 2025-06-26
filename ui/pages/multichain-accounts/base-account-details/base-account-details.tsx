import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEvmAccountType } from '@metamask/keyring-api';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress, getUseBlockie } from '../../../selectors';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
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
  getWalletIdAndNameByAccountAddress,
  WalletMetadata,
} from '../../../selectors/multichain-accounts/account-tree';

type BaseAccountDetailsProps = {
  children?: React.ReactNode | React.ReactNode[];
};

export const BaseAccountDetails = ({ children }: BaseAccountDetailsProps) => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const useBlockie = useSelector(getUseBlockie);
  const history = useHistory();
  const t = useI18nContext();
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: { name },
    type,
  } = account;
  const formattedAddress = isEvmAccountType(type)
    ? toChecksumHexAddress(address)?.toLowerCase()
    : address;
  const shortenedAddress = shortenAddress(formattedAddress);

  const [isEditingAccountName, setIsEditingAccountName] = useState(false);

  const handleShowAddress = () => {
    history.push(ACCOUNT_DETAILS_QR_CODE_ROUTE);
  };

  // we can never have a scenario where an account is not associated with a wallet.
  const { id: walletId, name: walletName } = useSelector((state) =>
    getWalletIdAndNameByAccountAddress(state, address),
  ) as WalletMetadata;

  const walletRoute = `/wallet-details/${walletId}`;

  return (
    <Page backgroundColor={BackgroundColor.backgroundDefault}>
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        }
      >
        {name}
      </Header>
      <Content paddingTop={3}>
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
        {isEditingAccountName && (
          <EditAccountNameModal
            isOpen={isEditingAccountName}
            onClose={() => setIsEditingAccountName(false)}
            currentAccountName={name}
            address={address}
          />
        )}
      </Content>
    </Page>
  );
};
