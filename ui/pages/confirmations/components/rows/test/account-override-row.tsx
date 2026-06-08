import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AvatarAccountSize } from '@metamask/design-system-react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  Box,
  Text,
} from '../../../../../components/component-library';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar/preferred-avatar';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getEvmInternalAccounts } from '../../../../../selectors';
import { getAllAccountGroups } from '../../../../../selectors/multichain-accounts/account-tree';
import { updateEditableParams } from '../../../../../store/actions';
import { setTransactionPayConfig } from '../../../../../store/controller-actions/transaction-pay-controller';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionAccountOverride } from '../../../hooks/pay/useTransactionAccountOverride';
import {
  useTransactionPayIsPostQuote,
  useTransactionPayPrimaryRequiredToken,
} from '../../../hooks/pay/useTransactionPayData';
import {
  decodeERC20TransferAmount,
  generateERC20TransferData,
} from '../../developer/utils';

// Non-transfer calldata so post-quote mode is driven by requiredAssets, not
// ERC-20 transfer decoding. The execution tx is a zero-value self-transfer.
const POST_QUOTE_DATA = '0x' as Hex;

type AccountOverrideAccount = {
  id: string;
  address: string;
  metadata: {
    name: string;
  };
};

type TargetToken = {
  address: Hex;
  amountHuman?: string;
  chainId: Hex;
  decimals: number;
  symbol: string;
};

export function AccountOverrideRow() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const accountOverride = useTransactionAccountOverride();
  const isPostQuote = useTransactionPayIsPostQuote();
  const requiredToken = useTransactionPayPrimaryRequiredToken();
  const evmAccounts = useSelector(getEvmInternalAccounts);
  const accountGroups = useSelector(getAllAccountGroups);

  const txFrom = currentConfirmation?.txParams?.from as Hex | undefined;
  const selectedAddress = accountOverride ?? txFrom;

  const targetToken = useMemo(
    () => toTargetToken(requiredToken ?? {}),
    [requiredToken],
  );

  // Keep account labels aligned with multichain account groups. Internal
  // account metadata names are empty in current account-tree state.
  const accounts = useMemo<AccountOverrideAccount[]>(
    () =>
      evmAccounts.map((account) => {
        const groupName = accountGroups.find((group) =>
          (group.accounts as string[]).includes(account.id),
        )?.metadata.name;

        return {
          ...account,
          metadata: {
            ...account.metadata,
            name: groupName ?? account.metadata.name,
          },
        };
      }),
    [evmAccounts, accountGroups],
  );

  const handleChange = useCallback(
    async (address: Hex) => {
      if (!currentConfirmation || !txFrom) {
        return;
      }

      // Treat selecting the original from address as "no override". Send null
      // because undefined keys are stripped by structured-clone postMessage.
      const isOriginal = address.toLowerCase() === txFrom.toLowerCase();
      const nextAccountOverride = isOriginal ? undefined : address;

      await setTransactionPayConfig(currentConfirmation.id, {
        accountOverride: isOriginal ? null : address,
      });

      if (!isPostQuote || !targetToken) {
        return;
      }

      const amountHuman = getTransactionAmountHuman(
        currentConfirmation,
        targetToken.decimals,
        targetToken.amountHuman,
      );

      dispatch(
        updateEditableParams(currentConfirmation.id, {
          to: nextAccountOverride ? targetToken.address : txFrom,
          data: nextAccountOverride
            ? buildTransferData(nextAccountOverride, amountHuman, targetToken)
            : POST_QUOTE_DATA,
          value: '0x0',
          updateType: false,
        }),
      );
    },
    [currentConfirmation, dispatch, isPostQuote, targetToken, txFrom],
  );

  if (!txFrom) {
    return null;
  }

  return (
    <Box
      data-testid="account-override-pill"
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.pill}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={3}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={2}
      paddingRight={4}
    >
      {selectedAddress && (
        <PreferredAvatar address={selectedAddress} size={AvatarAccountSize.Xs} />
      )}
      <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
        {t('account')}
      </Text>
      <select
        value={selectedAddress?.toLowerCase() ?? ''}
        onChange={(e) => handleChange(e.target.value as Hex)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 'inherit',
        }}
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.address.toLowerCase()}>
            {account.metadata.name}
          </option>
        ))}
      </select>
    </Box>
  );
}

function buildTransferData(
  recipient: Hex,
  amountHuman: string,
  targetToken: TargetToken,
): Hex {
  return generateERC20TransferData(
    recipient,
    amountHuman,
    targetToken.decimals,
  ) as Hex;
}

function getTransactionAmountHuman(
  transactionMeta: TransactionMeta,
  decimals: number,
  fallbackAmountHuman = '0',
): string {
  const data = transactionMeta.txParams?.data as string | undefined;

  if (data && data !== POST_QUOTE_DATA) {
    return decodeERC20TransferAmount(data, decimals);
  }

  return fallbackAmountHuman;
}

function toTargetToken(token: {
  address?: string;
  amountHuman?: string;
  chainId?: string;
  decimals?: number | string;
  symbol?: string;
}): TargetToken | undefined {
  if (!token.address || !token.chainId) {
    return undefined;
  }

  return {
    address: token.address as Hex,
    amountHuman: token.amountHuman,
    chainId: token.chainId as Hex,
    decimals: Number(token.decimals ?? 18),
    symbol: token.symbol ?? '',
  };
}
