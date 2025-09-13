import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { Box, Icon, IconName, Text } from '../../component-library';
import { PreferredAvatar } from '../../app/preferred-avatar';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  accountName: string;
  onClick?: (accountGroupId: AccountGroupId) => void;
  balance: string;
  startAccessory?: React.ReactNode;
  endAccessory?: React.ReactNode;
  selected?: boolean;
  walletName?: string;
  disableHoverEffect?: boolean;
};

export const MultichainAccountCell = ({
  accountId,
  accountName,
  onClick,
  balance,
  startAccessory,
  endAccessory,
  selected = false,
  walletName,
  disableHoverEffect = false,
}: MultichainAccountCellProps) => {
  const handleClick = () => onClick?.(accountId);
  const seedAddressIcon = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(state, accountId),
  );

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
      padding={4}
      onClick={handleClick}
      className={`multichain-account-cell${disableHoverEffect ? ' multichain-account-cell--no-hover' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
    >
      {startAccessory}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}
      >
        <Box
          className="multichain-account-cell__account-avatar"
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          borderColor={
            selected ? BorderColor.primaryDefault : BorderColor.transparent
          }
          borderRadius={BorderRadius.XL}
        >
          <PreferredAvatar address={seedAddressIcon} />
        </Box>
        <Box>
          <Text
            className="multichain-account-cell__account-name"
            variant={TextVariant.bodyMdMedium}
            marginLeft={3}
            ellipsis
          >
            {accountName}
          </Text>
          {walletName && (
            <Text
              className="multichain-account-cell__account-name"
              color={TextColor.textAlternative}
              variant={TextVariant.bodySmMedium}
              marginLeft={3}
              ellipsis
            >
              {walletName}
            </Text>
          )}
        </Box>

        {!startAccessory && selected && (
          <Icon
            name={IconName.CheckBold}
            color={IconColor.primaryDefault}
            marginLeft={1}
            marginRight={1}
            data-testid={`multichain-account-cell-${accountId}-selected-icon`}
            style={{ flexShrink: 0 }}
          />
        )}
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        style={{ flexShrink: 0 }}
      >
        <Text
          className="multichain-account-cell__account-balance"
          data-testid="balance-display"
          variant={TextVariant.bodyMdMedium}
          marginRight={2}
        >
          {balance}
        </Text>
        <Box
          className="multichain-account-cell__end_accessory"
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexEnd}
        >
          {endAccessory}
        </Box>
      </Box>
    </Box>
  );
};
