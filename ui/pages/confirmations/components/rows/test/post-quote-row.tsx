import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { Box, Text } from '../../../../../components/component-library';
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
import { updateTransaction } from '../../../../../store/actions';
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

type TargetToken = {
  address: Hex;
  amountHuman?: string;
  chainId: Hex;
  decimals: number;
  symbol: string;
};

export function PostQuoteRow() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const accountOverride = useTransactionAccountOverride();
  const isPostQuote = useTransactionPayIsPostQuote();
  const requiredToken = useTransactionPayPrimaryRequiredToken();

  const targetToken = useMemo(
    () => toTargetToken(requiredToken ?? {}),
    [requiredToken],
  );

  const handleToggle = useCallback(async () => {
    if (!currentConfirmation || !targetToken) {
      return;
    }

    const from = currentConfirmation.txParams?.from as Hex | undefined;
    if (!from) {
      return;
    }

    const nextIsPostQuote = !isPostQuote;
    const amountHuman = getTransactionAmountHuman(
      currentConfirmation,
      targetToken.decimals,
      targetToken.amountHuman,
    );

    await setTransactionPayConfig(currentConfirmation.id, {
      isPostQuote: nextIsPostQuote,
    });

    dispatch(
      updateTransaction(
        nextIsPostQuote
          ? {
              ...currentConfirmation,
              requiredAssets: [
                buildRequiredAsset(targetToken, amountHuman),
                ...(currentConfirmation.requiredAssets?.slice(1) ?? []),
              ],
              txParams: {
                ...currentConfirmation.txParams,
                to: accountOverride ? targetToken.address : from,
                data: accountOverride
                  ? buildTransferData(accountOverride, amountHuman, targetToken)
                  : POST_QUOTE_DATA,
                value: '0x0',
              },
            }
          : {
              ...currentConfirmation,
              requiredAssets: undefined,
              txParams: {
                ...currentConfirmation.txParams,
                to: targetToken.address,
                data: buildTransferData(from, amountHuman, targetToken),
                value: '0x0',
              },
            },
        true,
      ),
    );
  }, [
    accountOverride,
    currentConfirmation,
    dispatch,
    isPostQuote,
    targetToken,
  ]);

  const handleInputClick = useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      event.stopPropagation();
    },
    [],
  );

  if (!targetToken) {
    return null;
  }

  return (
    <Box
      data-testid="post-quote-checkbox"
      onClick={handleToggle}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.pill}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={3}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={4}
      paddingRight={4}
      style={{ cursor: 'pointer' }}
    >
      <input
        type="checkbox"
        checked={isPostQuote}
        onClick={handleInputClick}
        onChange={handleToggle}
        style={{ cursor: 'pointer' }}
      />
      <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
        {t('postQuote')}
      </Text>
    </Box>
  );
}

function buildRequiredAsset(targetToken: TargetToken, amountHuman: string) {
  return {
    address: targetToken.address,
    amount: getAtomicAmountHex(amountHuman, targetToken.decimals),
    standard: 'erc20',
  };
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

function getAtomicAmountHex(amountHuman: string, decimals: number): Hex {
  return `0x${new BigNumber(amountHuman)
    .times(new BigNumber(10).pow(decimals))
    .round(0, BigNumber.ROUND_UP)
    .toString(16)}` as Hex;
}
