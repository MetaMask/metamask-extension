import React, { useEffect, memo } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  type BoxProps,
  FontWeight,
} from '@metamask/design-system-react';
import {
  TextColor as LegacyTextColor,
  TextVariant as LegacyTextVariant,
} from '../../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../../app/preferred-avatar';
import { useMultichainAccountTotalFiatBalance } from '../../../../hooks/useMultichainAccountTotalFiatBalance';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';

export type WalletDetailsAccountItemProps = {
  account: InternalAccount;
  onClick: (account: InternalAccount) => void;
  onBalanceUpdate: (accountId: string, balance: string) => void;
  className?: string;
  rowStylesProps?: BoxProps;
};

const WalletDetailsAccountItem = ({
  account,
  onClick,
  onBalanceUpdate,
  className,
  ...rowStylesProps
}: WalletDetailsAccountItemProps) => {
  const { totalFiatBalance } = useMultichainAccountTotalFiatBalance(account);

  useEffect(() => {
    onBalanceUpdate(account.id, totalFiatBalance);
  }, [totalFiatBalance, account.id, onBalanceUpdate]);

  return (
    <Box
      asChild
      className={className}
      padding={4}
      marginBottom={1}
      {...rowStylesProps}
    >
      <button
        type="button"
        onClick={() => onClick(account)}
        className="w-full cursor-pointer border-none bg-transparent text-left"
        data-testid={`wallet-details-account-item-${account.id}`}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          <PreferredAvatar
            address={account.address}
            size={AvatarAccountSize.Sm}
          />
          <Box>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {account.metadata.name}
            </Text>
          </Box>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <UserPreferencedCurrencyDisplay
            account={account}
            value={totalFiatBalance}
            type="PRIMARY"
            ethNumberOfDecimals={4}
            hideTitle
            showFiat
            isAggregatedFiatOverviewBalance
            hideLabel
            textProps={{
              color: LegacyTextColor.textAlternative,
              variant: LegacyTextVariant.bodyMdMedium,
            }}
          />
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconMuted}
          />
        </Box>
      </button>
    </Box>
  );
};

export default memo(WalletDetailsAccountItem);
