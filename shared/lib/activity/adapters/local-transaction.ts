import { TransactionType } from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { SWAPS_WRAPPED_TOKENS_ADDRESSES } from '../../../constants/swaps';
import { toAssetId } from '../../asset-utils';
import type { TransactionGroup } from '../../multichain/types';
import { isEqualCaseInsensitive } from '../../string-utils';
import {
  parseApprovalTransactionData,
  parseStandardTokenTransactionData,
  resolveApprovalTokenContractAddress,
} from '../../transaction.utils';
import { TOKEN_TRANSFER_LOG_TOPIC_HASH } from '../../transactions-controller-utils';
import type { ActivityFee, ActivityListItem, TokenAmount } from '../types';
import {
  supplyMethodIds,
  unwrapMethodIds,
  withdrawMethodIds,
  wrapMethodIds,
} from './constants';
import {
  getKnownTokenMetadata,
  getLocalTransactionFees,
  getLocalTransactionStatus,
  getNativeAssetSafe,
  isNftStandard,
} from './helpers';

const EVM_NATIVE_DECIMALS = 18;

// Converts local TransactionController groups into activity items
export function mapLocalTransaction(
  transactionGroup: TransactionGroup & {
    sourceToken?: TokenAmount;
    destinationToken?: TokenAmount;
    nativeAssetSymbol?: string;
    contractTokenMetadata?: { symbol?: string; decimals?: number };
    activityStatus?: ActivityListItem['status'];
    fees?: ActivityFee[];
  },
): ActivityListItem {
  const fees =
    transactionGroup.fees ?? getLocalTransactionFees(transactionGroup);
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    Number.parseInt(initialTransaction.chainId, 16).toString(),
  );
  const nativeAsset = getNativeAssetSafe(initialTransaction.chainId);
  // Prefer the network-configured ticker (resolved by the selector from
  // NetworkController state) over the bridge-controller swaps registry,
  // which hard-codes synthetic symbols like `TESTETH` for chains such as
  // Localhost (0x539) regardless of how the user configured the network.
  const nativeSymbol =
    transactionGroup.nativeAssetSymbol ?? nativeAsset?.symbol;

  const getNativeToken = (
    transaction: TransactionGroup['initialTransaction'],
    direction: TokenAmount['direction'],
  ): TokenAmount | undefined => {
    if (nativeSymbol === undefined) {
      return undefined;
    }

    return {
      direction,
      symbol: nativeSymbol,
      ...(transaction.txParams.value
        ? { amount: transaction.txParams.value }
        : {}),
      ...(nativeAsset?.assetId ? { assetId: nativeAsset.assetId } : {}),
      decimals: nativeAsset?.decimals ?? EVM_NATIVE_DECIMALS,
    };
  };

  const getContractToken = ({
    amount,
    contractAddress,
    direction,
    transaction,
  }: {
    amount?: string;
    contractAddress?: string;
    direction: TokenAmount['direction'];
    transaction: TransactionGroup['initialTransaction'];
  }): TokenAmount | undefined => {
    if (contractAddress === undefined) {
      return undefined;
    }

    const tokenMetadata = getKnownTokenMetadata(chainId, contractAddress);

    const isWrappedNativeToken = isEqualCaseInsensitive(
      contractAddress,
      SWAPS_WRAPPED_TOKENS_ADDRESSES[
        initialTransaction.chainId as keyof typeof SWAPS_WRAPPED_TOKENS_ADDRESSES
      ] || '',
    );
    const wrappedNativeTokenDecimals = isWrappedNativeToken
      ? (nativeAsset?.decimals ?? EVM_NATIVE_DECIMALS)
      : undefined;

    const decimals =
      transaction.transferInformation?.amount === undefined
        ? (tokenMetadata?.decimals ??
          transactionGroup.contractTokenMetadata?.decimals ??
          wrappedNativeTokenDecimals)
        : transaction.transferInformation.decimals;
    const tokenAmount = transaction.transferInformation?.amount ?? amount;
    const symbol =
      transaction.transferInformation?.symbol ??
      tokenMetadata?.symbol ??
      transactionGroup.contractTokenMetadata?.symbol;
    const assetId = toAssetId(contractAddress, chainId);

    return {
      direction,
      ...(symbol ? { symbol } : {}),
      ...(assetId ? { assetId } : {}),
      ...(tokenAmount ? { amount: tokenAmount } : {}),
      ...(decimals === undefined ? {} : { decimals }),
    };
  };

  // EVM approvals mirror the API path, which never returns an approved amount
  const mapApprovalToken = () => {
    const contractAddress =
      resolveApprovalTokenContractAddress(initialTransaction);
    return getContractToken({
      transaction: initialTransaction,
      direction: 'out',
      contractAddress,
    });
  };

  const getLegacySwapToken = (direction: TokenAmount['direction']) => {
    const key = direction === 'out' ? 'token_from' : 'token_to';
    const initialSwapMetaDataSymbol = initialTransaction.swapMetaData?.[key];
    const primarySwapMetaDataSymbol = primaryTransaction.swapMetaData?.[key];
    const initialTokenSymbol =
      typeof initialSwapMetaDataSymbol === 'string'
        ? initialSwapMetaDataSymbol
        : undefined;
    const primaryTokenSymbol =
      typeof primarySwapMetaDataSymbol === 'string'
        ? primarySwapMetaDataSymbol
        : undefined;
    const { value } = initialTransaction.txParams;
    let hasNativeValue = false;

    if (value !== undefined && value !== '') {
      try {
        hasNativeValue = BigInt(value) > 0n;
      } catch {
        hasNativeValue = false;
      }
    }

    let symbol =
      initialTransaction.destinationTokenSymbol ??
      primaryTransaction.destinationTokenSymbol ??
      initialTokenSymbol ??
      primaryTokenSymbol;

    if (direction === 'out') {
      symbol =
        initialTransaction.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol ??
        initialTokenSymbol ??
        primaryTokenSymbol ??
        (hasNativeValue ? nativeSymbol : undefined);
    }

    if (symbol === undefined) {
      return undefined;
    }

    return {
      direction,
      symbol,
      ...(symbol === nativeSymbol && nativeAsset?.assetId
        ? { assetId: nativeAsset.assetId }
        : {}),
    };
  };

  const status =
    transactionGroup.activityStatus ??
    getLocalTransactionStatus({
      primaryTransaction,
      initialTransaction,
    });
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';
  const methodId = initialTransaction.txParams.data?.slice(0, 10);

  switch (initialTransaction.type) {
    case TransactionType.simpleSend: {
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          to,
          token: getNativeToken(initialTransaction, 'out'),
        },
      };
    }

    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom: {
      const transactionData = initialTransaction.txParams.data
        ? parseStandardTokenTransactionData(initialTransaction.txParams.data)
        : undefined;
      const recipient = transactionData?.args?._to ?? transactionData?.args?.to;
      const amount =
        transactionData?.args?._value ?? transactionData?.args?.value;

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          to: typeof recipient === 'string' ? recipient : to,
          token: getContractToken({
            amount: amount?.toString(),
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };
    }

    case TransactionType.incoming: {
      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          to,
          token: initialTransaction.transferInformation?.contractAddress
            ? getContractToken({
                transaction: initialTransaction,
                direction: 'in',
                contractAddress:
                  initialTransaction.transferInformation.contractAddress,
              })
            : getNativeToken(initialTransaction, 'in'),
        },
      };
    }

    case TransactionType.swap:
    case TransactionType.swapAndSend: {
      const {
        sourceToken: enrichedSourceToken,
        destinationToken: enrichedDestinationToken,
      } = transactionGroup;
      const sourceToken = enrichedSourceToken ?? getLegacySwapToken('out');
      const destinationToken =
        enrichedDestinationToken ?? getLegacySwapToken('in');

      if (destinationToken?.symbol === undefined) {
        return {
          type: 'swapIncomplete',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from,
            sourceToken,
          },
        };
      }

      return {
        type: 'swap',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          sourceToken,
          destinationToken,
          fees,
        },
      };
    }

    case TransactionType.bridge: {
      const {
        sourceToken: enrichedSourceToken,
        destinationToken: enrichedDestinationToken,
      } = transactionGroup;
      return {
        type: 'bridge',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          sourceToken: enrichedSourceToken,
          destinationToken: enrichedDestinationToken,
          fees,
        },
      };
    }

    case TransactionType.musdConversion: {
      const transactionData = initialTransaction.txParams.data
        ? parseStandardTokenTransactionData(initialTransaction.txParams.data)
        : undefined;
      const amount =
        transactionData?.args?._value ?? transactionData?.args?.value;

      return {
        type: 'convert',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          sourceToken: transactionGroup.sourceToken,
          destinationToken: getContractToken({
            amount: amount?.toString(),
            transaction: initialTransaction,
            direction: 'in',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };
    }

    case TransactionType.perpsDeposit:
    case TransactionType.perpsDepositAndOrder:
    case TransactionType.perpsWithdraw: {
      const { metamaskPay } = initialTransaction;
      const token = to
        ? {
            direction: 'out' as const,
            assetId: toAssetId(to, chainId),
          }
        : undefined;

      const fiat = metamaskPay?.targetFiat
        ? { amount: metamaskPay.targetFiat }
        : undefined;
      const networkFee =
        typeof metamaskPay?.networkFeeFiat === 'string'
          ? { amount: metamaskPay.networkFeeFiat }
          : undefined;

      return {
        type:
          initialTransaction.type === TransactionType.perpsWithdraw
            ? 'perpsWithdraw'
            : 'perpsAddFunds',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          token,
          fiat,
          networkFee,
        },
      };
    }

    case TransactionType.bridgeApproval:
    case TransactionType.shieldSubscriptionApprove:
    case TransactionType.swapApproval:
    case TransactionType.tokenMethodSetApprovalForAll:
      return {
        type: 'approveSpendingCap',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          token: mapApprovalToken(),
        },
      };

    case TransactionType.tokenMethodApprove: {
      const approveData = initialTransaction.txParams.data
        ? parseApprovalTransactionData(
            initialTransaction.txParams.data as `0x${string}`,
          )
        : undefined;
      const approveAmount = approveData?.amountOrTokenId?.toFixed(0);
      return {
        type:
          approveAmount === '0' ? 'revokeSpendingCap' : 'approveSpendingCap',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          token: mapApprovalToken(),
        },
      };
    }

    case TransactionType.tokenMethodIncreaseAllowance:
      return {
        type: 'increaseSpendingCap',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          token: mapApprovalToken(),
        },
      };

    case TransactionType.lendingDeposit:
      return {
        type: 'lendingDeposit',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
        },
      };

    case TransactionType.stakingDeposit:
      return {
        type: 'deposit',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          token: getContractToken({
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };

    case TransactionType.musdClaim:
      return {
        type: 'claimMusdBonus',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
        },
      };

    default: {
      const isSupplyContractInteraction =
        initialTransaction.type === TransactionType.contractInteraction &&
        methodId &&
        supplyMethodIds.has(methodId.toLowerCase());
      const isWithdrawContractInteraction =
        initialTransaction.type === TransactionType.contractInteraction &&
        methodId &&
        withdrawMethodIds.has(methodId.toLowerCase());

      const suppliedTokenBalanceChange =
        isSupplyContractInteraction &&
        initialTransaction.simulationData?.tokenBalanceChanges?.find(
          ({ isDecrease, standard }) => isDecrease && standard === 'erc20',
        );
      const incomingNftBalanceChange =
        initialTransaction.type === TransactionType.contractInteraction &&
        initialTransaction.simulationData?.tokenBalanceChanges?.find(
          ({ isDecrease, standard }) => !isDecrease && isNftStandard(standard),
        );
      let hasNativeValue = false;

      try {
        hasNativeValue = BigInt(initialTransaction.txParams.value ?? '0') > 0n;
      } catch {
        hasNativeValue = false;
      }

      if (incomingNftBalanceChange && hasNativeValue) {
        return {
          type: 'nftBuy',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from,
            token: {
              direction: 'in',
            },
          },
        };
      }

      if (suppliedTokenBalanceChange) {
        return {
          type: 'lendingDeposit',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from,
          },
        };
      }

      // lending withdrawal - applies to Earn features only
      if (isWithdrawContractInteraction) {
        const fromAddress = from.toLowerCase();
        const receivedTokenLog = (
          initialTransaction.txReceipt?.logs ?? []
        ).find(({ topics: [eventTopic, , logTo] = [] }) => {
          const toAddress = logTo
            ? `0x${logTo.slice(-40)}`.toLowerCase()
            : undefined;

          return (
            eventTopic?.toLowerCase() === TOKEN_TRANSFER_LOG_TOPIC_HASH &&
            toAddress === fromAddress
          );
        });
        const destinationToken = receivedTokenLog
          ? getContractToken({
              amount: BigInt(String(receivedTokenLog.data)).toString(),
              transaction: initialTransaction,
              direction: 'in',
              contractAddress: receivedTokenLog.address,
            })
          : undefined;

        return {
          type: 'lendingWithdrawal',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from,
            destinationToken,
          },
        };
      }

      // wrap and unwrap
      if (
        initialTransaction.type === TransactionType.contractInteraction &&
        methodId
      ) {
        const wrappedTokenAddress =
          SWAPS_WRAPPED_TOKENS_ADDRESSES[
            initialTransaction.chainId as keyof typeof SWAPS_WRAPPED_TOKENS_ADDRESSES
          ];

        if (
          wrappedTokenAddress &&
          isEqualCaseInsensitive(to, wrappedTokenAddress)
        ) {
          const normalizedMethodId = methodId.toLowerCase();

          if (wrapMethodIds.has(normalizedMethodId)) {
            const { value: wrapAmount } = initialTransaction.txParams;

            try {
              if (wrapAmount && BigInt(wrapAmount) > 0n) {
                return {
                  type: 'wrap',
                  chainId,
                  status,
                  timestamp,
                  hash,
                  data: {
                    from,
                    sourceToken: getNativeToken(initialTransaction, 'out'),
                    destinationToken: getContractToken({
                      amount: wrapAmount,
                      transaction: initialTransaction,
                      direction: 'in',
                      contractAddress: wrappedTokenAddress,
                    }),
                  },
                };
              }
            } catch {
              // Invalid native value — fall through.
            }
          }

          if (unwrapMethodIds.has(normalizedMethodId)) {
            const { data } = initialTransaction.txParams;
            let unwrapAmount: string | undefined;

            if (data && data.length >= 74) {
              try {
                unwrapAmount = BigInt(`0x${data.slice(10, 74)}`).toString();
              } catch {
                unwrapAmount = undefined;
              }
            }

            const nativeToken = getNativeToken(initialTransaction, 'in');

            return {
              type: 'unwrap',
              chainId,
              status,
              timestamp,
              hash,
              data: {
                from,
                sourceToken: getContractToken({
                  amount: unwrapAmount,
                  transaction: initialTransaction,
                  direction: 'out',
                  contractAddress: wrappedTokenAddress,
                }),
                destinationToken:
                  nativeToken && unwrapAmount
                    ? { ...nativeToken, amount: unwrapAmount }
                    : nativeToken,
              },
            };
          }
        }
      }

      const token = (() => {
        const { value } = initialTransaction.txParams;

        if (value === undefined || value === '') {
          return undefined;
        }

        try {
          return BigInt(value) > 0n
            ? getNativeToken(initialTransaction, 'out')
            : undefined;
        } catch {
          return undefined;
        }
      })();

      return {
        type: 'contractInteraction',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from,
          to,
          ...(token ? { token } : {}),
          methodId,
          transactionType: initialTransaction.type,
        },
      };
    }
  }
}
