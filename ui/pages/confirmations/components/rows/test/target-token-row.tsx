/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { toHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ScrollContainer } from '../../../../../contexts/scroll-container';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  rejectPendingApproval,
  updateTransaction,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import {
  useTransactionPayIsPostQuote,
  useTransactionPayPrimaryRequiredToken,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionAccountOverride } from '../../../hooks/pay/useTransactionAccountOverride';
import { useSendTokens } from '../../../hooks/send/useSendTokens';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { type Asset as AssetType } from '../../../types/send';
import {
  decodeERC20TransferAmount,
  generateERC20TransferData,
} from '../../developer/utils';
import { Asset } from '../../send/asset';
import { TokenIcon } from '../../token-icon';

const METAMASK_PAY_TEST_TYPE =
  'metamaskPayTest' as unknown as TransactionType;

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

type TargetTokenAutoAdderProps = {
  targetToken: TargetToken;
};

type TargetTokenPillProps = {
  isPostQuote: boolean;
  targetToken: TargetToken;
  balanceUsd: number;
  onOpen: () => void;
};

type TargetTokenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: AssetType) => void;
};

export function TargetTokenRow() {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { navigateToTransaction } = useConfirmationNavigation();
  const requiredToken = useTransactionPayPrimaryRequiredToken();
  const isPostQuote = useTransactionPayIsPostQuote();
  const accountOverride = useTransactionAccountOverride();
  const walletTokens = useSendTokens({ ignoreAccountOverride: true });

  const targetToken = useMemo(
    () => toTargetToken(requiredToken ?? {}),
    [requiredToken],
  );

  const targetTokenBalanceUsd = useMemo(() => {
    if (!targetToken) {
      return 0;
    }

    const match = walletTokens.find(
      (tok) =>
        tok.address?.toLowerCase() === targetToken.address.toLowerCase() &&
        String(tok.chainId) === String(targetToken.chainId),
    );

    return match?.fiat?.balance ?? 0;
  }, [walletTokens, targetToken]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleTokenSelect = useCallback(
    async (token: AssetType) => {
      setIsModalOpen(false);

      if (!currentConfirmation || !targetToken) {
        return;
      }

      const newToken = toTargetToken(token);
      if (!newToken) {
        return;
      }

      const currentAmountHuman = getTransactionAmountHuman(
        currentConfirmation,
        targetToken.decimals,
        targetToken.amountHuman,
      );

      const isCrossChain =
        newToken.chainId !== (currentConfirmation.chainId as Hex);

      if (isCrossChain) {
        const from = currentConfirmation.txParams?.from as Hex | undefined;
        const txId = currentConfirmation.id;

        if (!from) {
          return;
        }

        try {
          const networkClientId = await findNetworkClientIdByChainId(
            newToken.chainId,
          );
          const data = buildTransferData(from, currentAmountHuman, newToken);
          const txMeta = await addTransaction(
            { from, to: newToken.address, data, value: '0x0' },
            { networkClientId, type: METAMASK_PAY_TEST_TYPE },
          );

          navigateToTransaction(txMeta.id, {
            loader: ConfirmationLoader.CustomAmount,
          });

          await dispatch(
            rejectPendingApproval(
              txId,
              serializeError(providerErrors.userRejectedRequest()),
            ),
          );
        } catch (error) {
          console.error('Failed to recreate MetaMask Pay tx on new chain', error);
        }

        return;
      }

      const from = currentConfirmation.txParams?.from as Hex | undefined;
      if (!from) {
        return;
      }

      if (isPostQuote) {
        dispatch(
          updateTransaction(
            {
              ...currentConfirmation,
              requiredAssets: [
                buildRequiredAsset(newToken, currentAmountHuman),
                ...(currentConfirmation.requiredAssets?.slice(1) ?? []),
              ],
              txParams: {
                ...currentConfirmation.txParams,
                to: accountOverride ? newToken.address : from,
                data: accountOverride
                  ? buildTransferData(
                      accountOverride,
                      currentAmountHuman,
                      newToken,
                    )
                  : POST_QUOTE_DATA,
                value: '0x0',
              },
            },
            true,
          ),
        );

        return;
      }

      dispatch(
        updateTransaction(
          {
            ...currentConfirmation,
            txParams: {
              ...currentConfirmation.txParams,
              to: newToken.address,
              data: buildTransferData(from, currentAmountHuman, newToken),
              value: '0x0',
            },
          },
          true,
        ),
      );
    },
    [
      accountOverride,
      currentConfirmation,
      dispatch,
      isPostQuote,
      navigateToTransaction,
      targetToken,
    ],
  );

  if (!targetToken) {
    return null;
  }

  return (
    <>
      <TargetTokenPill
        isPostQuote={isPostQuote}
        targetToken={targetToken}
        balanceUsd={targetTokenBalanceUsd}
        onOpen={handleOpen}
      />
      <TargetTokenModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onTokenSelect={handleTokenSelect}
      />
      <TargetTokenAutoAdder targetToken={targetToken} />
    </>
  );
}

function TargetTokenAutoAdder({ targetToken }: TargetTokenAutoAdderProps) {
  useAddToken({
    tokenAddress: targetToken.address,
    chainId: targetToken.chainId,
    symbol: targetToken.symbol,
    decimals: targetToken.decimals,
  });

  return null;
}

function TargetTokenPill({
  isPostQuote,
  targetToken,
  balanceUsd,
  onOpen,
}: TargetTokenPillProps) {
  const t = useI18nContext();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const balanceUsdFormatted = fiatFormatter(balanceUsd);

  return (
    <Box
      data-testid="target-token-pill"
      onClick={onOpen}
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
      style={{ cursor: 'pointer' }}
    >
      <TokenIcon
        chainId={targetToken.chainId}
        tokenAddress={targetToken.address}
        symbol={targetToken.symbol}
      />
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textDefault}
        data-testid="target-token-symbol"
      >
        {`${isPostQuote ? t('source') : t('target')} ${targetToken.symbol}`}
      </Text>
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
        data-testid="target-token-balance"
      >
        {balanceUsdFormatted}
      </Text>
      <Icon
        data-testid="target-token-arrow"
        name={IconName.ArrowDown}
        size={IconSize.Sm}
        color={IconColor.iconAlternative}
      />
    </Box>
  );
}

function TargetTokenModal({
  isOpen,
  onClose,
  onTokenSelect,
}: TargetTokenModalProps) {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isClosedOnOutsideClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('targetToken')}</ModalHeader>
        <ScrollContainer style={{ flex: 1, overflow: 'auto' }}>
          <Asset
            includeNoBalance
            hideNfts
            ignoreAccountOverride
            onAssetSelect={onTokenSelect}
          />
        </ScrollContainer>
      </ModalContent>
    </Modal>
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
  chainId?: number | string;
  decimals?: number | string;
  symbol?: string;
}): TargetToken | undefined {
  if (!token.address || !token.chainId) {
    return undefined;
  }

  return {
    address: token.address as Hex,
    amountHuman: token.amountHuman,
    chainId: getHexChainId(token.chainId),
    decimals: Number(token.decimals ?? 18),
    symbol: token.symbol ?? '',
  };
}

function getHexChainId(chainId: number | string): Hex {
  const chainIdString = String(chainId);

  return chainIdString.startsWith('0x')
    ? (chainIdString as Hex)
    : (toHex(chainId) as Hex);
}

function getAtomicAmountHex(amountHuman: string, decimals: number): Hex {
  return `0x${new BigNumber(amountHuman)
    .times(new BigNumber(10).pow(decimals))
    .round(0, BigNumber.ROUND_UP)
    .toString(16)}` as Hex;
}
