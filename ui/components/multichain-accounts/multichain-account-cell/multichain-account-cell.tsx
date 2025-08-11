import React from 'react';
import { AccountGroupId } from '@metamask/account-api';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Icon,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  accountName: string;
  onClick?: (accountGroupId: AccountGroupId) => void;
  balance: string;
  endAccessory?: React.ReactNode;
  selected?: boolean;
};

export const MultichainAccountCell = ({
  accountId,
  accountName,
  onClick,
  balance,
  endAccessory,
  selected = false,
}: MultichainAccountCellProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(accountId);
    }
  };

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
      padding={4}
      onClick={handleClick}
      className="multichain-account-cell"
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
    >
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
          padding={1}
        >
          {/* // TODO: Replace avatar account with one that supports multichain, when available */}
          <AvatarAccount
            size={AvatarAccountSize.Md}
            address={accountId}
            variant={AvatarAccountVariant.Jazzicon}
          />
        </Box>
        <Text
          className="multichain-account-cell__account-name"
          variant={TextVariant.bodyMdMedium}
          marginLeft={3}
          ellipsis
        >
          {accountName}
        </Text>
        {selected && (
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
