import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  getAllTokens,
  getCurrencyRates,
  getKnownMethodData,
  getMarketData,
  getNativeTokenInfo,
  getSelectedAddress,
  selectERC20TokensByChain,
} from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { toChecksumHexAddress } from '../../shared/lib/hexstring-utils';
import {
  getStatusKey,
  getTransactionTypeTitle,
} from '../helpers/utils/transactions.util';
import { camelCaseToCapitalize } from '../helpers/utils/common.util';
import { PRIMARY, SECONDARY } from '../helpers/constants/common';
import {
  getAssetDetails,
  getTokenAddressParam,
  getTokenIdParam,
} from '../helpers/utils/token-util';

import {
  PENDING_STATUS_HASH,
  TOKEN_CATEGORY_HASH,
} from '../helpers/constants/transactions';
import { getNfts } from '../ducks/metamask/metamask';
import { captureSingleException } from '../store/actions';
import { isEqualCaseInsensitive } from '../../shared/lib/string-utils';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { useBridgeTokenDisplayData } from '../pages/bridge/hooks/useBridgeTokenDisplayData';
import { formatAmount } from '../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../ducks/locale/locale';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../shared/constants/bridge';
import { calcTokenAmount } from '../../shared/lib/transactions-controller-utils';
import {
  selectBridgeHistoryForOriginalTxMetaId,
  selectBridgeHistoryItemForTxMetaId,
} from '../ducks/bridge-status/selectors';

import { PAY_TRANSACTION_TYPES } from '../pages/confirmations/constants/pay';
import { resolveTransactionType } from '../components/app/transaction-list-item/helpers';
import { useI18nContext } from './useI18nContext';
import { useTokenFiatAmount } from './useTokenFiatAmount';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';
import { useCurrencyDisplay } from './useCurrencyDisplay';
import { useTokenDisplayValue } from './useTokenDisplayValue';
import { useTokenData } from './useTokenData';
import { useSwappedTokenValue } from './useSwappedTokenValue';
import { useCurrentAsset } from './useCurrentAsset';
import useBridgeChainInfo from './bridge/useBridgeChainInfo';
import { useFiatFormatter } from './useFiatFormatter';

/**
 *  There are seven types of transaction entries that are currently differentiated in the design:
 *  1. Signature request
 *  2. Send (sendEth sendTokens)
 *  3. Deposit
 *  4. Site interaction
 *  5. Approval
 *  6. Swap
 *  7. Swap Approval
 */
const signatureTypes = [
  null,
  undefined,
  TransactionType.sign,
  TransactionType.personalSign,
  TransactionType.signTypedData,
  TransactionType.ethDecrypt,
  TransactionType.ethGetEncryptionPublicKey,
];

/**
 * @typedef {(import('../../selectors/transactions').TransactionGroup} TransactionGroup
 */

/**
 * @typedef {object} TransactionDisplayData
 * @property {string} primaryCurrency - the currency string to display in the primary position
 * @property {string} recipientAddress - the Ethereum address of the recipient
 * @property {string} title - the primary title of the tx that will be displayed in the activity list
 * @property {string} [secondaryCurrency] - the currency string to display in the secondary position
 * @property {boolean} isPending - indicates if the transaction is pending
 */

/**
 * Get computed values used for displaying transaction data to a user
 *
 * The goal of this method is to perform all of the necessary computation and
 * state access required to take a transactionGroup and derive from it a shape
 * of data that can power all views related to a transaction. Presently the main
 * case is for shared logic between transaction-list-item and transaction-detail-view
 *
 * @param {TransactionGroup} transactionGroup - group of transactions of the same nonce
 * @returns {TransactionDisplayData}
 */
export function useTransactionDisplayData(transactionGroup) {
  // To determine which primary currency to display for swaps transactions we need to be aware
  // of which asset, if any, we are viewing at present
  const dispatch = useDispatch();
  const locale = useSelector(getIntlLocale);
  const currentAsset = useCurrentAsset();
  const knownTokens = useSelector(getAllTokens);
  const selectedAddress = useSelector(getSelectedAddress);
  const knownNfts = useSelector(getNfts);
  const tokenListAllChains = useSelector(selectERC20TokensByChain);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const fiatFormatter = useFiatFormatter();
  // For post-quote pay flows (e.g. Perps Withdraw) the values surfaced
  // through `metamaskPay` (`targetFiat`, fee `*.usd`) are explicitly USD,
  // so use a USD-pinned formatter when rendering them — even if the user
  // has selected a different display currency.
  const usdFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const t = useI18nContext();

  // Bridge data
  const srcTxMetaId = transactionGroup.initialTransaction.id;
  const bridgeHistoryItemByTxMetaId = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, srcTxMetaId),
  );
  const bridgeHistoryItemByOriginalTxMetaId = useSelector((state) =>
    selectBridgeHistoryForOriginalTxMetaId(state, srcTxMetaId),
  );
  const bridgeHistoryItem =
    bridgeHistoryItemByTxMetaId ?? bridgeHistoryItemByOriginalTxMetaId;
  const { destNetwork } = useBridgeChainInfo({
    transaction: transactionGroup.initialTransaction,
  });

  const destChainName = NETWORK_TO_SHORT_NETWORK_NAME_MAP[destNetwork?.chainId];

  const { initialTransaction, primaryTransaction } = transactionGroup;
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  const { transferInformation, type: rawType } = initialTransaction;
  const { from: senderAddress, to } = initialTransaction.txParams || {};

  const type = resolveTransactionType(
    rawType,
    to,
    initialTransaction.txParams?.data,
  );

  const isUnifiedSwapTx =
    [TransactionType.swap, TransactionType.bridge].includes(type) &&
    Boolean(bridgeHistoryItem);

  // for smart contract interactions, methodData can be used to derive the name of the action being taken
  const methodData =
    useSelector((state) =>
      getKnownMethodData(state, initialTransaction?.txParams?.data),
    ) || {};

  const displayedStatusKey = getStatusKey(primaryTransaction);
  const isPending = displayedStatusKey in PENDING_STATUS_HASH;
  const mounted = useRef(true);

  const primaryValue = primaryTransaction.txParams?.value;

  let prefix = '-';
  let recipientAddress = to;
  const transactionData = initialTransaction?.txParams?.data;

  // This value is used to determine whether we should look inside txParams.data
  // to pull out and render token related information
  const isTokenCategory = TOKEN_CATEGORY_HASH[type];
  // these values are always instantiated because they are either
  // used by or returned from hooks. Hooks must be called at the top level,
  // so as an additional safeguard against inappropriately associating token
  // transfers, we pass an additional argument to these hooks that will be
  // false for non-token transactions. This additional argument forces the
  // hook to return null
  let token = null;
  const [currentAssetDetails, setCurrentAssetDetails] = useState(null);

  if (isTokenCategory) {
    token =
      knownTokens?.[transactionGroup?.initialTransaction?.chainId]?.[
        selectedAddress
      ]?.find(({ address }) =>
        isEqualCaseInsensitive(address, recipientAddress),
      ) ||
      tokenListAllChains?.[transactionGroup?.initialTransaction?.chainId]
        ?.data?.[recipientAddress.toLowerCase()];
  }
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    async function getAndSetAssetDetails() {
      if (isTokenCategory && !token) {
        try {
          const assetDetails = await getAssetDetails(
            recipientAddress,
            senderAddress,
            transactionData,
            knownNfts,
          );
          if (mounted.current === true) {
            setCurrentAssetDetails(assetDetails);
          }
        } catch (e) {
          console.warn('Unable to set asset details', {
            error: e,
            transactionData,
          });
        }
      }
    }
    getAndSetAssetDetails();
  }, [
    isTokenCategory,
    token,
    recipientAddress,
    senderAddress,
    knownNfts,
    mounted,
    transactionData,
  ]);

  if (currentAssetDetails) {
    token = {
      address: currentAssetDetails.toAddress,
      symbol: currentAssetDetails.symbol,
      decimals: currentAssetDetails.decimals,
    };
  }

  const tokenData = useTokenData(transactionData, isTokenCategory);

  // Sometimes the tokenId value is parsed as "_value" param. Not seeing this often any more, but still occasionally:
  // i.e. call approve() on BAYC contract - https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#writeContract, and tokenId shows up as _value,
  // not sure why since it doesn't match the ERC721 ABI spec we use to parse these transactions - https://github.com/MetaMask/metamask-eth-abis/blob/d0474308a288f9252597b7c93a3a8deaad19e1b2/src/abis/abiERC721.ts#L62.
  const transactionDataTokenId =
    getTokenIdParam(tokenData) ?? getTokenValueParam(tokenData);

  const nft =
    isTokenCategory &&
    knownNfts.find(
      ({ address, tokenId }) =>
        isEqualCaseInsensitive(address, recipientAddress) &&
        tokenId === transactionDataTokenId,
    );

  let tokenDisplayValue = useTokenDisplayValue(
    transactionData,
    token,
    isTokenCategory,
  );

  if (transferInformation?.decimals) {
    tokenDisplayValue = calcTokenAmount(
      transferInformation.amount,
      transferInformation.decimals,
    ).toString(10);
  }

  const tokenFiatAmount = useTokenFiatAmount(
    token?.address,
    tokenDisplayValue,
    token?.symbol,
    undefined,
    true,
    initialTransaction?.chainId,
  );

  // used to append to the primary display value. initialized to either token.symbol or undefined
  // but can later be modified if dealing with a swap
  let primarySuffix = isTokenCategory ? token?.symbol : undefined;
  // used to display the primary value of tx. initialized to either tokenDisplayValue or undefined
  // but can later be modified if dealing with a swap
  let primaryDisplayValue = isTokenCategory ? tokenDisplayValue : undefined;
  // used to display fiat amount of tx. initialized to either tokenFiatAmount or undefined
  // but can later be modified if dealing with a swap
  let secondaryDisplayValue = isTokenCategory ? tokenFiatAmount : undefined;
  // when set, replaces the `useCurrencyDisplay`-formatted `primaryCurrency`.
  // Used by the post-quote fallback path (e.g. Perps Withdraw without rate
  // data) so we can render a fiat string without `useCurrencyDisplay`
  // auto-appending the chain native ticker (which would misleadingly read
  // as "$50 worth of ETH/BNB" instead of "$50").
  let primaryCurrencyOverride;

  let title;

  const {
    swapTokenValue,
    isNegative,
    swapTokenFiatAmount,
    isViewingReceivedTokenFromSwap,
  } = useSwappedTokenValue(transactionGroup, currentAsset);

  const bridgeTokenDisplayData = useBridgeTokenDisplayData({
    transactionGroup,
  });

  if (signatureTypes.includes(type)) {
    title = t('signatureRequest');
  } else if (type === TransactionType.swap) {
    title = t('swapTokenToToken', [
      bridgeTokenDisplayData.sourceTokenSymbol ??
        initialTransaction.sourceTokenSymbol,
      bridgeTokenDisplayData.destinationTokenSymbol ??
        initialTransaction.destinationTokenSymbol,
    ]);
    const symbolFromTx =
      bridgeTokenDisplayData.sourceTokenSymbol ??
      initialTransaction.sourceTokenSymbol;
    primarySuffix = isViewingReceivedTokenFromSwap
      ? currentAsset.symbol
      : symbolFromTx;
    const value =
      bridgeTokenDisplayData.sourceTokenAmountSent ?? swapTokenValue;
    primaryDisplayValue = value
      ? formatAmount(locale, new BigNumber(value))
      : undefined;
    secondaryDisplayValue =
      bridgeTokenDisplayData.displayCurrencyAmount ?? swapTokenFiatAmount;
    if (isNegative) {
      prefix = '';
    } else if (isViewingReceivedTokenFromSwap) {
      prefix = '+';
    } else {
      prefix = '-';
    }
  } else if (type === TransactionType.swapAndSend) {
    const isSenderTokenRecipient =
      initialTransaction.swapAndSendRecipient === senderAddress;

    recipientAddress = initialTransaction.swapAndSendRecipient;

    title = t('sentTokenAsToken', [
      initialTransaction.sourceTokenSymbol,
      initialTransaction.destinationTokenSymbol,
    ]);
    primarySuffix =
      isViewingReceivedTokenFromSwap && isSenderTokenRecipient
        ? currentAsset.symbol
        : initialTransaction.sourceTokenSymbol;
    primaryDisplayValue = swapTokenValue;
    secondaryDisplayValue = swapTokenFiatAmount;

    if (isNegative) {
      prefix = '';
    } else if (isViewingReceivedTokenFromSwap && isSenderTokenRecipient) {
      prefix = '+';
    } else {
      prefix = '-';
    }
  } else if (type === TransactionType.swapApproval) {
    title = t('swapApproval', [
      bridgeTokenDisplayData.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol,
    ]);
    primarySuffix =
      bridgeTokenDisplayData.sourceTokenSymbol ??
      primaryTransaction.sourceTokenSymbol;
  } else if (type === TransactionType.tokenMethodApprove) {
    prefix = '';
    title = t('approveSpendingCap', [
      token?.symbol || t('token').toLowerCase(),
    ]);
  } else if (type === TransactionType.tokenMethodSetApprovalForAll) {
    const isRevoke = !tokenData?.args?.[1];

    prefix = '';
    title = isRevoke
      ? t('revokePermissionTitle', [token?.symbol || nft?.name || t('token')])
      : t('setApprovalForAllTitle', [token?.symbol || t('token')]);
  } else if (type === TransactionType.tokenMethodIncreaseAllowance) {
    prefix = '';
    title = t('approveIncreaseAllowance', [token?.symbol || t('token')]);
  } else if (
    type === TransactionType.contractInteraction ||
    type === TransactionType.batch ||
    type === TransactionType.revokeDelegation
  ) {
    const transactionTypeTitle = getTransactionTypeTitle(t, type);
    title =
      (methodData?.name && camelCaseToCapitalize(methodData.name)) ||
      transactionTypeTitle;
  } else if (type === TransactionType.deployContract) {
    title = getTransactionTypeTitle(t, type);
  } else if (type === TransactionType.incoming) {
    title = t('received');
    prefix = '';
  } else if (
    type === TransactionType.tokenMethodTransferFrom ||
    type === TransactionType.tokenMethodTransfer
  ) {
    title = t('sentSpecifiedTokens', [
      token?.symbol || nft?.name || t('token'),
    ]);
    recipientAddress = getTokenAddressParam(tokenData);
  } else if (type === TransactionType.tokenMethodSafeTransferFrom) {
    title = t('safeTransferFrom');
    recipientAddress = getTokenAddressParam(tokenData);
  } else if (type === TransactionType.simpleSend) {
    title = t('sent');
  } else if (type === TransactionType.bridgeApproval) {
    title = t('bridgeApproval', [bridgeTokenDisplayData.sourceTokenSymbol]);
    primarySuffix = bridgeTokenDisplayData.sourceTokenSymbol;
  } else if (type === TransactionType.bridge) {
    title = destChainName ? t('bridgedToChain', [destChainName]) : t('bridged');
    primarySuffix = bridgeTokenDisplayData.sourceTokenSymbol;
    primaryDisplayValue = formatAmount(
      locale,
      new BigNumber(bridgeTokenDisplayData.sourceTokenAmountSent ?? 0),
    );
    secondaryDisplayValue = bridgeTokenDisplayData.displayCurrencyAmount;
  } else if (PAY_TRANSACTION_TYPES.includes(type)) {
    const { metamaskPay } = initialTransaction;
    const isPostQuote = metamaskPay?.isPostQuote === true;

    // For post-quote flows (e.g. perpsWithdraw) `metamaskPay.tokenAddress` +
    // `metamaskPay.chainId` describe the DESTINATION token the user receives,
    // not the source. For regular pay flows they describe the source token.
    const sourceTokenAddress = isPostQuote
      ? undefined
      : metamaskPay?.tokenAddress?.toLowerCase();
    const sourceChainId = isPostQuote ? undefined : metamaskPay?.chainId;
    const sourceToken =
      sourceTokenAddress &&
      sourceChainId &&
      tokenListAllChains?.[sourceChainId]?.data?.[sourceTokenAddress];

    if (type === TransactionType.perpsDeposit) {
      title = t('perpsDepositActivityTitle');
    } else if (type === TransactionType.perpsWithdraw) {
      title = t('perpsWithdrawActivityTitle');
    } else if (type === TransactionType.musdClaim) {
      title = t('musdClaimTitle');
    } else {
      title = t('musdConversionActivityTitle', [
        sourceToken?.symbol ?? 'Token',
      ]);
    }

    prefix = '';

    // For post-quote flows, resolve the destination token via metamaskPay
    // (the tx's own `to` field is a placeholder ERC-20 transfer used purely
    // to drive the confirmation UI). Otherwise fall back to the legacy
    // `to` + initialTransaction.chainId lookup used by deposit flows.
    const targetLookupAddress = isPostQuote
      ? metamaskPay?.tokenAddress?.toLowerCase()
      : to?.toLowerCase();
    const targetLookupChainId = isPostQuote
      ? metamaskPay?.chainId
      : initialTransaction.chainId;

    const { symbol: targetTokenSymbol, isNative: isNativeTarget } =
      resolveTargetToken({
        address: targetLookupAddress,
        chainId: targetLookupChainId,
        networkConfigurationsByChainId,
        tokenListAllChains,
      });

    if (isPostQuote) {
      // Post-quote withdrawals (e.g. Perps Withdraw): the completed tx does
      // not carry a destination-token amount; derive it from targetFiat /
      // destinationTokenUsdRate, the same way mobile's
      // `getPostQuoteDisplay` (app/components/UI/TransactionElement/utils.js)
      // renders the Activity row.
      const fiatUsd = parseFloat(metamaskPay?.targetFiat ?? '');
      const tokenUsdRate = getDestinationTokenUsdRate({
        address: targetLookupAddress,
        chainId: targetLookupChainId,
        isNative: isNativeTarget,
        marketData,
        currencyRates,
        networkConfigurationsByChainId,
      });

      const hasValidInputs =
        Number.isFinite(fiatUsd) && fiatUsd > 0 && tokenUsdRate > 0;
      const receivedAmount = hasValidInputs
        ? fiatUsd / tokenUsdRate
        : undefined;

      const formattedReceived = formatPostQuoteReceivedAmount(receivedAmount);
      if (formattedReceived !== undefined) {
        // Successful conversion — render in destination-token units.
        primaryDisplayValue = formattedReceived;
        if (targetTokenSymbol) {
          primarySuffix = targetTokenSymbol;
        }
      } else if (metamaskPay?.targetFiat) {
        // Rate unavailable — render the USD value directly via the override
        // so `useCurrencyDisplay` doesn't auto-append the chain native
        // ticker (which would falsely render "$50" as "50 ETH" / "50 BNB").
        primaryCurrencyOverride = usdFormatter(fiatUsd);
      }

      if (metamaskPay?.targetFiat) {
        secondaryDisplayValue = usdFormatter(fiatUsd);
      }
    } else {
      // Non-post-quote pay flows (perpsDeposit, musdClaim, musdConversion):
      // mirror pre-refactor behavior — set the destination-token suffix
      // whenever a target token is resolvable, independently of whether
      // metamaskPay.targetFiat is present.
      if (targetTokenSymbol) {
        primarySuffix = targetTokenSymbol;
      }
      if (metamaskPay?.targetFiat) {
        primaryDisplayValue = metamaskPay.targetFiat;
        secondaryDisplayValue = fiatFormatter(Number(metamaskPay.targetFiat));
      }
    }
  } else {
    dispatch(
      captureSingleException(
        `useTransactionDisplayData does not recognize transaction type. Type received is: ${type}`,
      ),
    );
  }

  const primaryCurrencyPreferences = useUserPreferencedCurrency(
    PRIMARY,
    {},
    transactionGroup?.initialTransaction?.chainId,
  );
  const secondaryCurrencyPreferences = useUserPreferencedCurrency(SECONDARY);

  const [primaryCurrency] = useCurrencyDisplay(
    primaryValue,
    {
      prefix,
      displayValue: primaryDisplayValue,
      suffix: primarySuffix,
      ...primaryCurrencyPreferences,
    },
    transactionGroup?.initialTransaction?.chainId,
  );

  const [secondaryCurrency] = useCurrencyDisplay(
    primaryValue,
    {
      prefix,
      displayValue: isUnifiedSwapTx
        ? bridgeTokenDisplayData.displayCurrencyAmount
        : secondaryDisplayValue,
      hideLabel: isTokenCategory || Boolean(swapTokenValue),
      ...secondaryCurrencyPreferences,
    },
    transactionGroup?.initialTransaction?.chainId,
  );

  if (!recipientAddress && transferInformation) {
    recipientAddress = to;
  }

  const resolvedPrimaryCurrency =
    type === TransactionType.swap && isPending ? '' : primaryCurrency;

  return {
    title,
    primaryCurrency: primaryCurrencyOverride ?? resolvedPrimaryCurrency,
    recipientAddress,
    secondaryCurrency:
      (isTokenCategory && !tokenFiatAmount) ||
      (!isUnifiedSwapTx &&
        [TransactionType.swap, TransactionType.swapAndSend].includes(type) &&
        !swapTokenFiatAmount) ||
      (isUnifiedSwapTx && !secondaryCurrency)
        ? undefined
        : secondaryCurrency,
    isPending,
  };
}

/**
 * Resolves the destination token's symbol and native flag from a token
 * address + chain ID. Native targets (e.g. BNB on BNB chain) are not in the
 * ERC-20 token list keyed by address, so they need a separate lookup via the
 * network configuration.
 *
 * @param {object} args
 * @param {string|undefined} args.address - Lower-cased token address.
 * @param {string|undefined} args.chainId - Hex chain ID.
 * @param {object|undefined} args.networkConfigurationsByChainId - Map keyed by chain ID.
 * @param {object|undefined} args.tokenListAllChains - ERC-20 token lists keyed by chain ID.
 * @returns {{ symbol: string|undefined, isNative: boolean }}
 */
function resolveTargetToken({
  address,
  chainId,
  networkConfigurationsByChainId,
  tokenListAllChains,
}) {
  if (!address || !chainId) {
    return { symbol: undefined, isNative: false };
  }

  const nativeAddress = getNativeTokenAddress(chainId).toLowerCase();
  const isNative = address === nativeAddress;

  if (isNative) {
    const nativeInfo = getNativeTokenInfo(
      networkConfigurationsByChainId,
      chainId,
    );
    return { symbol: nativeInfo?.symbol, isNative: true };
  }

  const targetToken = tokenListAllChains?.[chainId]?.data?.[address];
  return { symbol: targetToken?.symbol, isNative: false };
}

/**
 * Returns the USD value of 1 unit of the destination token, or 0 when it
 * cannot be determined. Native targets use the chain's native USD rate
 * directly; ERC-20 targets multiply the token's native-denominated price
 * (from market data) by the native USD rate.
 *
 * @param {object} args
 * @param {string|undefined} args.address - Lower-cased token address.
 * @param {string|undefined} args.chainId - Hex chain ID.
 * @param {boolean} args.isNative - Whether the destination is the chain's native token.
 * @param {object|undefined} args.marketData - Market data keyed by chain ID, then by checksum address.
 * @param {object|undefined} args.currencyRates - Currency rates keyed by native currency symbol.
 * @param {object|undefined} args.networkConfigurationsByChainId - Map keyed by chain ID.
 * @returns {number} USD per 1 token, or 0 if unavailable.
 */
function getDestinationTokenUsdRate({
  address,
  chainId,
  isNative,
  marketData,
  currencyRates,
  networkConfigurationsByChainId,
}) {
  const nativeCurrency =
    networkConfigurationsByChainId?.[chainId]?.nativeCurrency;
  const nativeUsdRate = currencyRates?.[nativeCurrency]?.usdConversionRate ?? 0;

  if (isNative) {
    return nativeUsdRate;
  }

  if (!address || !chainId) {
    return 0;
  }

  let checksumAddress;
  try {
    checksumAddress = toChecksumHexAddress(address);
  } catch {
    checksumAddress = undefined;
  }

  const tokenPrice =
    checksumAddress && marketData?.[chainId]?.[checksumAddress]?.price;
  return tokenPrice ? tokenPrice * nativeUsdRate : 0;
}

/**
 * Formats a destination token amount for the Activity row's primary display
 * value. Mirrors mobile's `getPostQuoteDisplay`: amounts >= 1 use 2 decimals,
 * smaller amounts use 4 significant figures.
 *
 * Returns `undefined` for any non-finite input (NaN, ±Infinity) to avoid
 * `RangeError` from `toFixed`/`toPrecision` — this can happen when
 * `tokenUsdRate` is small enough that `fiatUsd / tokenUsdRate` overflows.
 *
 * @param {number|undefined} amount - Token amount in token units (not wei).
 * @returns {string|undefined}
 */
function formatPostQuoteReceivedAmount(amount) {
  if (amount === undefined || !Number.isFinite(amount)) {
    return undefined;
  }
  return amount >= 1 ? amount.toFixed(2) : amount.toPrecision(4);
}
