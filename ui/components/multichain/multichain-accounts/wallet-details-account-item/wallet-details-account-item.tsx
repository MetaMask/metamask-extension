import React, { useEffect, memo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  BoxProps,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  IconColor,
  TextColor,
  TextVariant,
  BlockSize,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../../selectors';
import { useMultichainAccountTotalFiatBalance } from '../../../../hooks/useMultichainAccountTotalFiatBalance';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';

export type WalletDetailsAccountItemProps = {
  account: InternalAccount;
  onClick: (account: InternalAccount) => void;
  onBalanceUpdate: (accountId: string, balance: string) => void;
  className?: string;
  rowStylesProps?: BoxProps<typeof Box>;
};

const WalletDetailsAccountItem = ({
  account,
  onClick,
  onBalanceUpdate,
  className,
  ...rowStylesProps
}: WalletDetailsAccountItemProps) => {
  const useBlockie = useSelector(getUseBlockie);
  const { totalFiatBalance } = useMultichainAccountTotalFiatBalance(account);

  useEffect(() => {
    onBalanceUpdate(account.id, totalFiatBalance);
  }, [totalFiatBalance, account.id, onBalanceUpdate]);

  return (
    <Box
      className={className}
      as="button"
      onClick={() => onClick(account)}
      width={BlockSize.Full}
      textAlign={TextAlign.Left}
      padding={4}
      marginBottom={1}
      style={{ cursor: 'pointer', border: 'none' }}
      {...rowStylesProps}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
        <AvatarAccount
          address={account.address}
          size={AvatarAccountSize.Sm}
          variant={
            useBlockie
              ? AvatarAccountVariant.Blockies
              : AvatarAccountVariant.Jazzicon
          }
        />
        <Box>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {account.metadata.name}
          </Text>
        </Box>
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
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
            color: TextColor.textAlternative,
            variant: TextVariant.bodyMdMedium,
          }}
        />
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Sm}
          color={IconColor.iconMuted}
        />
      </Box>
    </Box>
  );
};

export default memo(WalletDetailsAccountItem);
