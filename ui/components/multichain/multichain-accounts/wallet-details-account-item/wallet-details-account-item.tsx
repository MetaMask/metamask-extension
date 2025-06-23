import React, { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
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
} from '../../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../../selectors';
import { useMultichainAccountTotalFiatBalance } from '../../../../hooks/useMultichainAccountTotalFiatBalance';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';

const WalletDetailsAccountItem = ({
  account,
  onClick,
  onBalanceUpdate,
  className,
}: {
  account: InternalAccount;
  onClick: (account: InternalAccount) => void;
  onBalanceUpdate: (accountId: string, balance: string) => void;
  className?: string;
}) => {
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
      style={{
        cursor: 'pointer',
        border: 'none',
        textAlign: 'left',
        width: '100%',
      }}
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

WalletDetailsAccountItem.propTypes = {
  account: PropTypes.shape({
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onBalanceUpdate: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default memo(WalletDetailsAccountItem);
