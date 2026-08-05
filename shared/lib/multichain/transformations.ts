import { toHex } from '@metamask/controller-utils';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../constants/network';
import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import type { TokenAmount } from './types';

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

export function parseValueTransfers(
  accountAddress: string,
  transaction: V1TransactionByHashResponse,
) {
  const { chainId, valueTransfers = [] } = transaction;
  const address = accountAddress.toLowerCase();
  const hexChainId = toHex(
    chainId,
  ) as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP;
  const nativeSymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[hexChainId] || '';
  const result: { from?: TokenAmount; to?: TokenAmount } = {};

  for (const transfer of valueTransfers) {
    if (
      transfer.transferType === 'erc721' ||
      transfer.transferType === 'erc1155'
    ) {
      continue;
    }

    const { amount, decimal, symbol, from, to, contractAddress } = transfer;
    const tokenAddress = contractAddress?.toLowerCase() || NATIVE_TOKEN_ADDRESS;

    const token = {
      chainId: hexChainId,
      address: tokenAddress,
      decimals: decimal,
      symbol: symbol || nativeSymbol,
    };

    if (!result.from && from?.toLowerCase() === address && amount) {
      const parsed = safeBigInt(amount);
      if (parsed !== undefined) {
        result.from = { token, amount: -parsed };
      }
    }

    if (!result.to && to?.toLowerCase() === address && amount) {
      const parsed = safeBigInt(amount);
      if (parsed !== undefined) {
        result.to = { token, amount: parsed };
      }
    }

    if (result.to && result.from) {
      break;
    }
  }

  if (
    valueTransfers.length === 0 &&
    (transaction.transactionCategory === 'STANDARD' ||
      transaction.transactionType === 'STANDARD')
  ) {
    result.from = {
      token: {
        address: NATIVE_TOKEN_ADDRESS,
        symbol: nativeSymbol,
        decimals: 18,
        chainId: hexChainId,
      },
      amount: -(safeBigInt(transaction.value) ?? BigInt(0)),
    };
  }

  return result;
}
