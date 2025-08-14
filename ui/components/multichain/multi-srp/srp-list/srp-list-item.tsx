import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  AvatarAccount,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { InternalAccountWithBalance } from '../../../../selectors';
import { useMultichainAccountTotalFiatBalance } from '../../../../hooks/useMultichainAccountTotalFiatBalance';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { shortenAddress } from '../../../../helpers/utils/util';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display';
import { Text, Box } from '../../../component-library';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { getMultichainAggregatedBalance } from '../../../../selectors/assets';

type SrpListItemProps = {
  account: InternalAccountWithBalance;
};

export const SrpListItem = ({ account }: SrpListItemProps) => {
  const { totalFiatBalance } = useMultichainAccountTotalFiatBalance(account);
  const isEvmAccount = isEvmAccountType(account.type);
  const multichainAggregatedBalance = useSelector((state) =>
    getMultichainAggregatedBalance(state, account),
  );

  const balance = useMemo(() => {
    if (isEvmAccount) {
      return totalFiatBalance;
    }
    return multichainAggregatedBalance.toString();
  }, [isEvmAccount, multichainAggregatedBalance, totalFiatBalance]);

  return (
    <Box
      key={account.address}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        <AvatarAccount address={account.address} size={AvatarAccountSize.Xs} />
        <Text
          className="srp-list__account-name"
          variant={TextVariant.bodySm}
          ellipsis
          paddingInlineStart={3}
        >
          {account.metadata.name}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          marginLeft={1}
          paddingInlineStart={1}
        >
          {shortenAddress(normalizeSafeAddress(account.address))}
        </Text>
      </Box>
      <Text variant={TextVariant.bodySm}>
        <UserPreferencedCurrencyDisplay
          account={account}
          value={balance}
          type="PRIMARY"
          ethNumberOfDecimals={4}
          hideTitle
          showFiat
          isAggregatedFiatOverviewBalance
          hideLabel
        />
      </Text>
    </Box>
  );
};
