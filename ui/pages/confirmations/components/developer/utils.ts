import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../hooks/useConfirmationNavigation';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

/**
 * Encodes an ERC-20 `transfer(address,uint256)` call for the developer-only
 * trigger buttons (Perps Deposit / Perps Withdraw / MUSD Conversion).
 *
 * Takes a human-readable amount (e.g. `'0'`, `'1.5'`) and scales it by the
 * token's decimals before encoding.
 *
 * @param recipient - ERC-20 transfer recipient.
 * @param amount - Human-readable amount as a decimal string.
 * @param decimals - Token decimals used to scale `amount` to its raw integer form.
 * @returns Encoded `transfer(recipient, rawAmount)` calldata.
 */
export const generateERC20TransferData = (
  recipient: Hex,
  amount: string,
  decimals: number,
): Hex => {
  const multiplier = new BigNumber(10).pow(decimals);
  const amountRaw = new BigNumber(amount).times(multiplier);

  return erc20Interface.encodeFunctionData('transfer', [
    recipient,
    `0x${amountRaw.toString(16)}`,
  ]) as Hex;
};

export type DeveloperTransferTransactionOptions = {
  /** Chain the transaction is created on. */
  chainId: Hex;
  /** ERC-20 token contract the `transfer` call is sent to. */
  tokenAddress: Hex;
  /** Token decimals used when encoding the transfer amount. */
  decimals: number;
  /** Transaction type applied to the created confirmation. */
  type: TransactionType;
  /** Message logged if creating the transaction fails. */
  errorMessage: string;
  /**
   * Resolves the ERC-20 transfer recipient from the sender address. Defaults to
   * the sender (a self-transfer), which is what the deposit/conversion flows use.
   */
  getRecipient?: (senderAddress: Hex) => Hex;
};

/**
 * Shared trigger logic for the developer-only ERC-20 "transfer" scaffold buttons
 * (Money Account Deposit / MUSD Conversion / Perps Deposit).
 *
 * Creates a zero-amount ERC-20 transfer transaction from the selected account
 * and navigates to the resulting custom-amount confirmation. The individual
 * buttons only differ by token, chain, transaction type, recipient and the
 * error message, so those are provided via options.
 *
 * @param options - Per-flow configuration.
 * @param options.chainId - Chain the transaction is created on.
 * @param options.tokenAddress - ERC-20 token contract the transfer is sent to.
 * @param options.decimals - Token decimals used when encoding the amount.
 * @param options.type - Transaction type applied to the created confirmation.
 * @param options.errorMessage - Message logged if creating the transaction fails.
 * @param options.getRecipient - Resolves the transfer recipient from the sender.
 * @returns The loading state and the click handler for the developer button.
 */
export function useDeveloperTransferTransaction({
  chainId,
  tokenAddress,
  decimals,
  type,
  errorMessage,
  getRecipient,
}: DeveloperTransferTransactionOptions) {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = useCallback(async () => {
    const senderAddress = selectedAccount?.address as Hex | undefined;

    if (!senderAddress) {
      console.error('No selected account');
      return;
    }

    setIsLoading(true);

    try {
      const networkClientId = await findNetworkClientIdByChainId(chainId);

      const recipient = getRecipient
        ? getRecipient(senderAddress)
        : senderAddress;

      const transferData = generateERC20TransferData(recipient, '0', decimals);

      const txMeta = await addTransaction(
        {
          from: senderAddress,
          to: tokenAddress,
          data: transferData,
          value: '0x0',
        },
        {
          networkClientId,
          type,
        },
      );

      navigateToTransaction(txMeta.id, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      console.error(errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  }, [
    chainId,
    decimals,
    errorMessage,
    getRecipient,
    navigateToTransaction,
    selectedAccount?.address,
    tokenAddress,
    type,
  ]);

  return { isLoading, handleTrigger };
}
