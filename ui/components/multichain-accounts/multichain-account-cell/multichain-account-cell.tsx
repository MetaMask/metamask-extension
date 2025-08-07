import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-tree-controller';
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
import { getMultichainAccountGroupById } from '../../../selectors/multichain-accounts/account-tree';

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  onClick?: () => void;
  balance: string;
  endAccessory?: React.ReactNode;
  selected?: boolean;
  showBalance?: boolean;
};

export const MultichainAccountCell = ({
  accountId,
  onClick,
  balance,
  endAccessory,
  selected = false,
  showBalance = true,
}: MultichainAccountCellProps) => {
  console.log('accountId', accountId);
  const accountGroup = useSelector((state) =>
    getMultichainAccountGroupById(state, accountId),
  );

  console.log('accountGroup', accountGroup);

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
      onClick={onClick}
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
          {accountGroup?.metadata.name}
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
        {showBalance && (
          <Text
            className="multichain-account-cell__account-balance"
            variant={TextVariant.bodyMdMedium}
            marginRight={2}
          >
            {balance}
          </Text>
        )}
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
