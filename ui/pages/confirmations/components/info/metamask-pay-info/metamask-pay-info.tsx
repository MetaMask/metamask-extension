/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';

import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { AvatarAccountSize } from '@metamask/design-system-react';
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
  updateEditableParams,
  updateTransaction,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useSendTokens } from '../../../hooks/send/useSendTokens';

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
import { getAllTokens, getEvmInternalAccounts } from '../../../../../selectors';
import { getAllAccountGroups } from '../../../../../selectors/multichain-accounts/account-tree';
import { setTransactionPayConfig } from '../../../../../store/controller-actions/transaction-pay-controller';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar/preferred-avatar';


// ─── Types ───────────────────────────────────────────────────────────────────

type SelectedTargetToken = {
  address: Hex;
  chainId: Hex;
  symbol: string;
  decimals: number;
};

type AccountOverrideAccount = {
  id: string;
  address: string;
  metadata: {
    name: string;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const METAMASK_PAY_TEST_TYPE = 'metamaskPayTest' as unknown as TransactionType;

const MAINNET_USDC_ADDRESS =
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex;
const MAINNET_CHAIN_ID = '0x1' as Hex;
const USDC_DECIMALS = 6;

// Dummy calldata for post-quote mode — non-transfer selector so TPC doesn't
// try to decode an ERC-20 transfer; requiredAssets drives the token/amount.
// The actual on-chain call will be a zero-value ETH self-transfer (to=from,
// data=0x, value=0x0) — harmless and always succeeds.
const POST_QUOTE_DATA = '0x' as Hex;

const DEFAULT_TARGET_TOKEN: SelectedTargetToken = {
  address: MAINNET_USDC_ADDRESS,
  chainId: MAINNET_CHAIN_ID,
  symbol: 'USDC',
  decimals: USDC_DECIMALS,
};

// ─── Exported component ──────────────────────────────────────────────────────

export function MetaMaskPayInfo() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { navigateToTransaction } = useConfirmationNavigation();
  const allTokens = useSelector(getAllTokens);
  const evmAccounts = useSelector(getEvmInternalAccounts);
  const accountGroups = useSelector(getAllAccountGroups);

  // Resolve display names from account groups — account.metadata.name is empty;
  // the actual label lives on the group that contains the account.
  const evmAccountsWithNames = useMemo(
    () =>
      evmAccounts.map((account) => {
        const groupName = accountGroups.find((g) =>
          (g.accounts as string[]).includes(account.id),
        )?.metadata.name;
        return {
          ...account,
          metadata: { ...account.metadata, name: groupName ?? account.metadata.name },
        };
      }),
    [evmAccounts, accountGroups],
  );

  // Derive initial target token from the tx — handles the cross-chain recreate
  // case where the new tx already has the correct token address + chainId baked in.
  // Looks up symbol/decimals from wallet state so the pill is populated immediately.
  const initialTargetToken = useMemo((): SelectedTargetToken => {
    const txTo = currentConfirmation?.txParams?.to as Hex | undefined;
    const txChainId = currentConfirmation?.chainId as Hex | undefined;

    const lookupToken = (address: Hex, chainId: Hex) => {
      const chainTokens = allTokens?.[chainId] ?? {};
      return Object.values(chainTokens)
        .flat()
        .find((tok) => tok.address?.toLowerCase() === address.toLowerCase());
    };

    if (
      txTo &&
      txChainId &&
      (txTo.toLowerCase() !== MAINNET_USDC_ADDRESS.toLowerCase() ||
        txChainId !== MAINNET_CHAIN_ID)
    ) {
      const walletToken = lookupToken(txTo, txChainId);
      return {
        address: txTo,
        chainId: txChainId,
        symbol: walletToken?.symbol ?? '',
        decimals: Number(walletToken?.decimals ?? 18),
      };
    }

    return DEFAULT_TARGET_TOKEN;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [targetToken, setTargetToken] = useState<SelectedTargetToken>(
    initialTargetToken,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostQuote, setIsPostQuote] = useState(false);
  const [accountOverride, setAccountOverride] = useState<Hex | undefined>(
    undefined,
  );

  const walletTokens = useSendTokens({ ignoreAccountOverride: true });
  const targetTokenBalanceUsd = useMemo(() => {
    const match = walletTokens.find(
      (tok) =>
        tok.address?.toLowerCase() === targetToken.address.toLowerCase() &&
        String(tok.chainId) === String(targetToken.chainId),
    );

    return match?.fiat?.balance ?? 0;
  }, [walletTokens, targetToken.address, targetToken.chainId]);

  useAddToken({
    tokenAddress: MAINNET_USDC_ADDRESS,
    chainId: MAINNET_CHAIN_ID,
    symbol: 'USDC',
    decimals: USDC_DECIMALS,
  });

  // Same-chain token change: push updated txParams.to + data to TC.
  // No-op in post-quote mode — txParams.to is the self-transfer address there
  // and requiredAssets[0].address tracks the target token instead.
  useEffect(() => {
    if (!currentConfirmation || isPostQuote) {
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

  const handlePostQuoteToggle = useCallback(async () => {
    if (!currentConfirmation) {
      return;
    }

    const next = !isPostQuote;
    setIsPostQuote(next);

    const txId = currentConfirmation.id;

    // Notify TPC so it switches quote mode.
    await setTransactionPayConfig(txId, { isPostQuote: next });

    const from = currentConfirmation.txParams?.from as Hex | undefined;
    const currentData = currentConfirmation.txParams?.data as string | undefined;
    const currentAmountHuman = currentData
      ? decodeERC20TransferAmount(currentData, targetToken.decimals)
      : '0';
    const currentAmountRaw = `0x${new BigNumber(currentAmountHuman)
      .times(new BigNumber(10).pow(targetToken.decimals))
      .round(0, BigNumber.ROUND_UP)
      .toString(16)}` as Hex;

    // When accountOverride is set, the execution tx transfers funds from
    // txParams.from → accountOverride; otherwise it's a self-transfer.
    const postQuoteTo = accountOverride ? targetToken.address : from;
    const postQuoteData = accountOverride
      ? (generateERC20TransferData(
          accountOverride,
          currentAmountHuman,
          targetToken.decimals,
        ) as Hex)
      : POST_QUOTE_DATA;

    const updated: TransactionMeta = next
      ? {
          ...currentConfirmation,
          requiredAssets: [
            {
              address: targetToken.address,
              amount: currentAmountRaw,
              standard: 'erc20',
            },
          ],
          txParams: {
            ...currentConfirmation.txParams,
            to: postQuoteTo,
            data: postQuoteData,
            value: '0x0',
          },
        }
      : {
          ...currentConfirmation,
          requiredAssets: undefined,
          txParams: {
            ...currentConfirmation.txParams,
            to: targetToken.address,
            data: from
              ? (generateERC20TransferData(
                  from,
                  currentAmountHuman,
                  targetToken.decimals,
                ) as Hex)
              : currentConfirmation.txParams?.data,
          },
        };

    dispatch(updateTransaction(updated, true));
  }, [currentConfirmation, dispatch, isPostQuote, targetToken.address, targetToken.decimals, accountOverride]);

  const handleAccountOverrideChange = useCallback(
    async (address: Hex | undefined) => {
      if (!currentConfirmation) {
        return;
      }

      const txFrom = currentConfirmation.txParams?.from as Hex | undefined;
      // Treat selecting the original from address as "no override" — clears it.
      // Send null (not undefined) so the value survives structured-clone serialization
      // across the background bridge — undefined keys are stripped during postMessage.
      const isOriginal =
        !address || address.toLowerCase() === txFrom?.toLowerCase();

      setAccountOverride(isOriginal ? undefined : address);
      await setTransactionPayConfig(currentConfirmation.id, {
        accountOverride: isOriginal ? null : address,
      });
    },
    [currentConfirmation],
  );

  // Sync tx data when accountOverride changes while post-quote is active.
  // In post-quote + accountOverride mode the execution tx is a token transfer
  // from txParams.from → accountOverride (the funds for the delegation).
  // When accountOverride is cleared, reverts to the self-transfer (0x data).
  // Uses updateEditableParams so only txParams is patched — requiredAssets
  // (set by handlePostQuoteToggle) is left untouched.
  // Does NOT run on isPostQuote changes — handlePostQuoteToggle handles that.
  useEffect(() => {
    if (!currentConfirmation || !isPostQuote) {
      return;
    }

    const txId = currentConfirmation.id;
    const from = currentConfirmation.txParams?.from as Hex | undefined;
    if (!from) {
      return;
    }

    if (accountOverride) {
      const currentData = currentConfirmation.txParams?.data as string | undefined;
      const currentAmountHuman =
        currentData && currentData !== POST_QUOTE_DATA
          ? decodeERC20TransferAmount(currentData, targetToken.decimals)
          : '0';

      const encoded = generateERC20TransferData(
        accountOverride,
        currentAmountHuman,
        targetToken.decimals,
      );

      dispatch(
        updateEditableParams(txId, {
          to: targetToken.address,
          data: encoded as Hex,
          value: '0x0',
          updateType: false,
        }),
      );
    } else {
      dispatch(
        updateEditableParams(txId, {
          to: from,
          data: POST_QUOTE_DATA as Hex,
          value: '0x0',
          updateType: false,
        }),
      );
    }
  }, [accountOverride]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <CustomAmountInfo
        autoFocusAmount
        currency="usd"
        hasMax
        payWithLabelOverride={isPostQuote ? t('receive') : undefined}
      >
        <PostQuoteCheckbox isPostQuote={isPostQuote} onToggle={handlePostQuoteToggle} />
        <TargetTokenPill
          isPostQuote={isPostQuote}
          targetToken={targetToken}
          balanceUsd={targetTokenBalanceUsd}
          onOpen={() => setIsModalOpen(true)}
        />
        <AccountOverridePill
          accounts={evmAccountsWithNames}
          selectedAddress={accountOverride ?? (currentConfirmation?.txParams?.from as Hex | undefined)}
          txFrom={currentConfirmation?.txParams?.from as Hex | undefined}
          onChange={handleAccountOverrideChange}
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

type PostQuoteCheckboxProps = {
  isPostQuote: boolean;
  onToggle: () => void;
};

function PostQuoteCheckbox({ isPostQuote, onToggle }: PostQuoteCheckboxProps) {
  const t = useI18nContext();

  return (
    <Box
      data-testid="post-quote-checkbox"
      onClick={onToggle}
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
        onChange={onToggle}
        style={{ cursor: 'pointer' }}
      />
      <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
        {t('postQuote')}
      </Text>
    </Box>
  );
}

type TargetTokenPillProps = {
  isPostQuote: boolean;
  targetToken: SelectedTargetToken;
  balanceUsd: number;
  onOpen: () => void;
};

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
          <Asset includeNoBalance hideNfts ignoreAccountOverride onAssetSelect={onTokenSelect} />
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

type AccountOverridePillProps = {
  accounts: AccountOverrideAccount[];
  selectedAddress: Hex | undefined;
  txFrom: Hex | undefined;
  onChange: (address: Hex | undefined) => void;
};

function AccountOverridePill({
  accounts,
  selectedAddress,
  txFrom,
  onChange,
}: AccountOverridePillProps) {
  const t = useI18nContext();

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
        <PreferredAvatar
          address={selectedAddress}
          size={AvatarAccountSize.Xs}
        />
      )}
      <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
        {t('account')}
      </Text>
      <select
        value={selectedAddress?.toLowerCase() ?? txFrom?.toLowerCase() ?? ''}
        onChange={(e) => onChange(e.target.value as Hex)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 'inherit', color: 'inherit' }}
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
