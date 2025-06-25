import React from 'react';
import { useSelector } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress } from '../../../selectors';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { AccountDetailsRow } from '../../../components/multichain-accounts/account-details-row';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IconName } from '../../../components/component-library/icon';
import { ButtonIcon, ButtonIconSize } from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';

type EVMAccountDetailsProps = {
  children?: React.ReactNode | React.ReactNode[];
};

export const EVMAccountDetails = ({ children }: EVMAccountDetailsProps) => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const t = useI18nContext();

  if (!account) {
    return null;
  }

  const { type } = account;
  const isERC4337 = type === 'eip155:erc4337';

  return (
    <BaseAccountDetails>
      {/* EVM-specific account details */}
      {isERC4337 && (
        <AccountDetailsRow
          label={t('accountType')}
          value={t('smartAccount')}
          style={{
            marginTop: '16px',
            marginBottom: '1px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          }}
        />
      )}

      {/* Add more EVM-specific rows here as needed */}
      {/* For example: */}
      {/* - Gas settings */}
      {/* - Network-specific information */}
      {/* - Contract interaction history */}

      {children}
    </BaseAccountDetails>
  );
};