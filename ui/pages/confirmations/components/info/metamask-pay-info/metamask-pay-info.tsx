/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';

import { providerErrors, serializeError } from '@metamask/rpc-errors';
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
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  rejectPendingApproval,
  updateTransaction,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { Asset } from '../../send/asset';
import { type Asset as AssetType } from '../../../types/send';
import { CustomAmountInfo } from '../custom-amount-info';
import { TokenIcon } from '../../token-icon';
import {
  decodeERC20TransferAmount,
  generateERC20TransferData,
} from '../../developer/utils';
import { getAllTokens } from '../../../../../selectors';


// ─── Types ───────────────────────────────────────────────────────────────────

type SelectedTargetToken = {
  address: Hex;
  chainId: Hex;
  symbol: string;
  decimals: number;
  balanceUsd: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const METAMASK_PAY_TEST_TYPE = 'metamaskPayTest' as unknown as TransactionType;

const MAINNET_USDC_ADDRESS =
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex;
const MAINNET_CHAIN_ID = '0x1' as Hex;
const USDC_DECIMALS = 6;

const DEFAULT_TARGET_TOKEN: SelectedTargetToken = {
  address: MAINNET_USDC_ADDRESS,
  chainId: MAINNET_CHAIN_ID,
  symbol: 'USDC',
  decimals: USDC_DECIMALS,
  balanceUsd: 0,
};

// ─── Exported component ──────────────────────────────────────────────────────

export function MetaMaskPayInfo() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { navigateToTransaction } = useConfirmationNavigation();
  const allTokens = useSelector(getAllTokens);

  // Derive initial target token from the tx — handles the cross-chain recreate
  // case where the new tx already has the correct token address + chainId baked in.
  // Looks up symbol/decimals from wallet state so the pill is populated immediately.
  const initialTargetToken = useMemo((): SelectedTargetToken => {
    const txTo = currentConfirmation?.txParams?.to as Hex | undefined;
    const txChainId = currentConfirmation?.chainId as Hex | undefined;

    if (
      txTo &&
      txChainId &&
      (txTo.toLowerCase() !== MAINNET_USDC_ADDRESS.toLowerCase() ||
        txChainId !== MAINNET_CHAIN_ID)
    ) {
      // Try to find the token in any account's token list for this chain.
      const chainTokens = allTokens?.[txChainId] ?? {};
      const walletToken = Object.values(chainTokens)
        .flat()
        .find((tok) => tok.address?.toLowerCase() === txTo.toLowerCase());

      return {
        address: txTo,
        chainId: txChainId,
        symbol: walletToken?.symbol ?? '',
        decimals: Number(walletToken?.decimals ?? 18),
        balanceUsd: 0,
      };
    }

    return DEFAULT_TARGET_TOKEN;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [targetToken, setTargetToken] = useState<SelectedTargetToken>(
    initialTargetToken,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useAddToken({
    tokenAddress: MAINNET_USDC_ADDRESS,
    chainId: MAINNET_CHAIN_ID,
    symbol: 'USDC',
    decimals: USDC_DECIMALS,
  });

  // Same-chain token change: push updated txParams.to + data to TC.
  useEffect(() => {
    if (!currentConfirmation) {
      return;
    }

    if (targetToken.chainId !== (currentConfirmation.chainId as Hex)) {
      return;
    }

    const recipient = currentConfirmation.txParams?.from as Hex | undefined;
    if (!recipient) {
      return;
    }

    // Preserve the current amount — decode from existing data then re-encode
    // for the new token's decimals so TPC keeps the same fiat amount.
    const currentData = currentConfirmation.txParams?.data as
      | string
      | undefined;
    const currentAmountHuman = currentData
      ? decodeERC20TransferAmount(currentData, targetToken.decimals)
      : '0';

    const encoded = generateERC20TransferData(
      recipient,
      currentAmountHuman,
      targetToken.decimals,
    );

    const updated: TransactionMeta = {
      ...currentConfirmation,
      txParams: {
        ...currentConfirmation.txParams,
        to: targetToken.address,
        data: encoded as Hex,
      },
    };

    dispatch(updateTransaction(updated, true));
  }, [targetToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const balanceUsdFormatted = useMemo(
    () => fiatFormatter(targetToken.balanceUsd),
    [fiatFormatter, targetToken.balanceUsd],
  );

  const handleTokenSelect = useCallback(
    async (token: AssetType) => {
      if (!token.address || !token.chainId) {
        return;
      }

      const newToken: SelectedTargetToken = {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
        symbol: token.symbol ?? '',
        decimals: Number(token.decimals ?? 18),
        balanceUsd: token.fiat?.balance ?? 0,
      };

      setIsModalOpen(false);

      const isCrossChain =
        currentConfirmation &&
        (token.chainId as Hex) !== (currentConfirmation.chainId as Hex);

      if (isCrossChain) {
        // Reject the current tx and create a fresh one on the new chain so
        // all network validations run correctly (avoids patching chainId
        // directly on an existing TransactionMeta).
        const from = currentConfirmation.txParams?.from as Hex;
        const txId = currentConfirmation.id;

        // Preserve the current amount by decoding it from the old tx data,
        // then re-encoding it scaled to the new token's decimals.
        const currentData = currentConfirmation.txParams?.data as
          | string
          | undefined;
        const currentAmountHuman = currentData
          ? decodeERC20TransferAmount(currentData, targetToken.decimals)
          : '0';

        try {
          const networkClientId = await findNetworkClientIdByChainId(
            newToken.chainId,
          );
          const encoded = generateERC20TransferData(
            from,
            currentAmountHuman,
            newToken.decimals,
          );
          const txMeta = await addTransaction(
            { from, to: newToken.address, data: encoded as Hex, value: '0x0' },
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

      setTargetToken(newToken);
    },
    [currentConfirmation, dispatch, navigateToTransaction, targetToken.decimals],
  );

  return (
    <>
      <CustomAmountInfo autoFocusAmount currency="usd" hasMax>
        <TargetTokenPill
          targetToken={targetToken}
          balanceUsdFormatted={balanceUsdFormatted}
          onOpen={() => setIsModalOpen(true)}
        />
      </CustomAmountInfo>

      <TargetTokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTokenSelect={handleTokenSelect}
      />

      <TokenAutoAdder
        address={targetToken.address}
        chainId={targetToken.chainId}
        symbol={targetToken.symbol}
        decimals={targetToken.decimals}
      />
    </>
  );
}

// ─── Private sub-components ──────────────────────────────────────────────────

type TargetTokenPillProps = {
  targetToken: SelectedTargetToken;
  balanceUsdFormatted: string;
  onOpen: () => void;
};

function TargetTokenPill({
  targetToken,
  balanceUsdFormatted,
  onOpen,
}: TargetTokenPillProps) {
  const t = useI18nContext();

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
        {`${t('target')} ${targetToken.symbol}`}
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

type TargetTokenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: AssetType) => void;
};

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
          <Asset includeNoBalance hideNfts onAssetSelect={onTokenSelect} />
        </ScrollContainer>
      </ModalContent>
    </Modal>
  );
}

type TokenAutoAdderProps = {
  address: Hex;
  chainId: Hex;
  symbol: string;
  decimals: number;
};

// Renders null; unconditionally calls useAddToken so the token is in wallet
// state before the confirmation tries to render its balance / required-token check.
function TokenAutoAdder({
  address,
  chainId,
  symbol,
  decimals,
}: TokenAutoAdderProps) {
  useAddToken({ tokenAddress: address, chainId, symbol, decimals });
  return null;
}
