import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { Box, SensitiveText, Text } from '../../component-library';
import { PreferredAvatar } from '../../app/preferred-avatar';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
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
  privacyMode?: boolean;
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
  privacyMode = false,
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
        position: 'relative',
      }}
      padding={4}
      onClick={handleClick}
      className={`multichain-account-cell${disableHoverEffect ? ' multichain-account-cell--no-hover' : ''}${selected ? ' is-selected' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
      backgroundColor={
        selected ? BackgroundColor.infoMuted : BackgroundColor.transparent
      }
    >
      {selected && !startAccessory && (
        <Box
          className="multichain-account-cell__selected-indicator"
          style={{
            width: '4px',
            position: 'absolute',
            left: '4px',
            top: '4px',
            bottom: '4px',
          }}
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
          data-testid={`multichain-account-cell-${accountId}-selected-indicator`}
        />
      )}
      {startAccessory}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        style={{ minWidth: 0, flex: 1 }}
      >
        <Box
          className="multichain-account-cell__account-avatar"
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          borderColor={BorderColor.transparent}
          borderRadius={BorderRadius.XL}
        >
          <PreferredAvatar address={seedAddressIcon} />
        </Box>
        <Box style={{ overflow: 'hidden' }}>
          {/* Prevent overflow of account name by long account names */}
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
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        style={{ flexShrink: 0 }}
      >
        <SensitiveText
          className="multichain-account-cell__account-balance"
          data-testid="balance-display"
          variant={TextVariant.bodyMdMedium}
          marginRight={2}
          isHidden={privacyMode}
          ellipsis
        >
          {balance}
        </SensitiveText>
        <Box
          className="multichain-account-cell__end_accessory"
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexEnd}
          data-testid="multichain-account-cell-end-accessory"
          aria-label={`${accountName} options`}
        >
          {endAccessory}
        </Box>
      </Box>
    </Box>
  );
};
