import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import {
  getAllDetectedTokens,
  getAllTokens,
  getKnownMethodData,
  getSelectedAddress,
  selectERC20TokensByChain,
} from '../selectors/selectors';
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
  formatDateWithYearContext,
  shortenAddress,
  stripHttpSchemes,
} from '../helpers/utils/util';

import {
  PENDING_STATUS_HASH,
  TOKEN_CATEGORY_HASH,
} from '../helpers/constants/transactions';
import { getNfts } from '../ducks/metamask/metamask';
import { TransactionGroupCategory } from '../../shared/constants/transaction';
import { captureSingleException } from '../store/actions';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { getTokenValueParam } from '../../shared/lib/metamask-controller-utils';
import { useBridgeTokenDisplayData } from '../pages/bridge/hooks/useBridgeTokenDisplayData';
import { formatAmount } from '../pages/confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../ducks/locale/locale';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../shared/constants/bridge';
import { calcTokenAmount } from '../../shared/lib/transactions-controller-utils';
import { selectBridgeHistoryItemForTxMetaId } from '../ducks/bridge-status/selectors';
import { useI18nContext } from './useI18nContext';
import { useTokenFiatAmount } from './useTokenFiatAmount';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';
import { useCurrencyDisplay } from './useCurrencyDisplay';
import { useTokenDisplayValue } from './useTokenDisplayValue';
import { useTokenData } from './useTokenData';
import { useSwappedTokenValue } from './useSwappedTokenValue';
import { useCurrentAsset } from './useCurrentAsset';
import useBridgeChainInfo from './bridge/useBridgeChainInfo';

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
 * @property {string} category - the transaction category that will be used for rendering the icon in the activity list
 * @property {string} primaryCurrency - the currency string to display in the primary position
 * @property {string} recipientAddress - the Ethereum address of the recipient
 * @property {string} senderAddress - the Ethereum address of the sender
 * @property {string} status - the status of the transaction
 * @property {string} subtitle - the supporting text describing the transaction
 * @property {boolean} subtitleContainsOrigin - true if the subtitle includes the origin of the tx
 * @property {string} title - the primary title of the tx that will be displayed in the activity list
 * @property {string} [secondaryCurrency] - the currency string to display in the secondary position
 * @property {string} date - the formatted date of the transaction
 * @property {string} displayedStatusKey - the key representing the displayed status of the transaction
 * @property {boolean} isPending - indicates if the transaction is pending
 * @property {boolean} isSubmitted - indicates if the transaction has been submitted
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
  const allDetectedTokens = useSelector(getAllDetectedTokens);
  const tokenListAllChains = useSelector(selectERC20TokensByChain);

  const t = useI18nContext();

  // Bridge data
  const srcTxMetaId = transactionGroup.initialTransaction.id;
  const bridgeHistoryItem = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, srcTxMetaId),
  );
  const { destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: transactionGroup.initialTransaction,
  });

  const destChainName = NETWORK_TO_SHORT_NETWORK_NAME_MAP[destNetwork?.chainId];

  const { initialTransaction, primaryTransaction } = transactionGroup;
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  const { transferInformation, type } = initialTransaction;
  const { from, to } = initialTransaction.txParams || {};

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
  const isSubmitted = displayedStatusKey === TransactionStatus.submitted;
  const mounted = useRef(true);

  const primaryValue = primaryTransaction.txParams?.value;
  const date = formatDateWithYearContext(initialTransaction.time);

  let prefix = '-';
  let subtitle;
  let subtitleContainsOrigin = false;
  let recipientAddress = to;
  const senderAddress = from;
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
      allDetectedTokens?.[transactionGroup?.initialTransaction?.chainId]?.[
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
        const assetDetails = await getAssetDetails(
          recipientAddress,
          senderAddress,
          transactionData,
          knownNfts,
        );
        if (mounted.current === true) {
          setCurrentAssetDetails(assetDetails);
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
  );

  const origin = stripHttpSchemes(
    initialTransaction.origin || initialTransaction.msgParams?.origin || '',
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

  let category;
  let title;

  const {
    swapTokenValue,
    isNegative,
    swapTokenFiatAmount,
    isViewingReceivedTokenFromSwap,
  } = useSwappedTokenValue(transactionGroup, currentAsset);

  const bridgeTokenDisplayData = useBridgeTokenDisplayData(transactionGroup);

  if (signatureTypes.includes(type)) {
    category = TransactionGroupCategory.signatureRequest;
    title = t('signatureRequest');
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TransactionType.swap) {
    category = TransactionGroupCategory.swap;
    title = t('swapTokenToToken', [
      bridgeTokenDisplayData.sourceTokenSymbol ??
        initialTransaction.sourceTokenSymbol,
      bridgeTokenDisplayData.destinationTokenSymbol ??
        initialTransaction.destinationTokenSymbol,
    ]);
    subtitle = origin;
    subtitleContainsOrigin = true;
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

    category = TransactionGroupCategory.swapAndSend;
    title = t('sentTokenAsToken', [
      initialTransaction.sourceTokenSymbol,
      initialTransaction.destinationTokenSymbol,
    ]);
    subtitle = origin;
    subtitleContainsOrigin = true;
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
    category = TransactionGroupCategory.approval;
    title = t('swapApproval', [
      bridgeTokenDisplayData.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol,
    ]);
    subtitle = origin;
    subtitleContainsOrigin = true;
    primarySuffix =
      bridgeTokenDisplayData.sourceTokenSymbol ??
      primaryTransaction.sourceTokenSymbol;
  } else if (type === TransactionType.tokenMethodApprove) {
    category = TransactionGroupCategory.approval;
    prefix = '';
    title = t('approveSpendingCap', [
      token?.symbol || t('token').toLowerCase(),
    ]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TransactionType.tokenMethodSetApprovalForAll) {
    const isRevoke = !tokenData?.args?.[1];

    category = TransactionGroupCategory.approval;
    prefix = '';
    title = isRevoke
      ? t('revokePermissionTitle', [token?.symbol || nft?.name || t('token')])
      : t('setApprovalForAllTitle', [token?.symbol || t('token')]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TransactionType.tokenMethodIncreaseAllowance) {
    category = TransactionGroupCategory.approval;
    prefix = '';
    title = t('approveIncreaseAllowance', [token?.symbol || t('token')]);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (
    type === TransactionType.contractInteraction ||
    type === TransactionType.batch ||
    type === TransactionType.revokeDelegation
  ) {
    category = TransactionGroupCategory.interaction;
    const transactionTypeTitle = getTransactionTypeTitle(t, type);
    title =
      (methodData?.name && camelCaseToCapitalize(methodData.name)) ||
      transactionTypeTitle;
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TransactionType.deployContract) {
    // @todo Should perhaps be a separate group?
    category = TransactionGroupCategory.interaction;
    title = getTransactionTypeTitle(t, type);
    subtitle = origin;
    subtitleContainsOrigin = true;
  } else if (type === TransactionType.incoming) {
    category = TransactionGroupCategory.receive;
    title = t('received');
    prefix = '';
    subtitle = t('fromAddress', [shortenAddress(senderAddress)]);
  } else if (
    type === TransactionType.tokenMethodTransferFrom ||
    type === TransactionType.tokenMethodTransfer
  ) {
    category = TransactionGroupCategory.send;
    title = t('sentSpecifiedTokens', [
      token?.symbol || nft?.name || t('token'),
    ]);
    recipientAddress = getTokenAddressParam(tokenData);
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else if (type === TransactionType.tokenMethodSafeTransferFrom) {
    category = TransactionGroupCategory.send;
    title = t('safeTransferFrom');
    recipientAddress = getTokenAddressParam(tokenData);
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else if (type === TransactionType.simpleSend) {
    category = TransactionGroupCategory.send;
    title = t('sent');
    subtitle = t('toAddress', [shortenAddress(recipientAddress)]);
  } else if (type === TransactionType.bridgeApproval) {
    title = t('bridgeApproval');
    category = TransactionGroupCategory.approval;
    title = t('bridgeApproval', [bridgeTokenDisplayData.sourceTokenSymbol]);
    subtitle = origin;
    subtitleContainsOrigin = true;
    primarySuffix = bridgeTokenDisplayData.sourceTokenSymbol;
  } else if (type === TransactionType.bridge) {
    title = destChainName ? t('bridgedToChain', [destChainName]) : t('bridged');
    category = bridgeTokenDisplayData.category;
    primarySuffix = bridgeTokenDisplayData.sourceTokenSymbol;
    primaryDisplayValue = formatAmount(
      locale,
      new BigNumber(bridgeTokenDisplayData.sourceTokenAmountSent ?? 0),
    );
    secondaryDisplayValue = bridgeTokenDisplayData.displayCurrencyAmount;
  } else {
    dispatch(
      captureSingleException(
        `useTransactionDisplayData does not recognize transaction type. Type received is: ${type}`,
      ),
    );
  }

  const detailsTitle = title;

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

  return {
    title,
    category,
    date,
    subtitle,
    subtitleContainsOrigin,
    primaryCurrency:
      type === TransactionType.swap && isPending ? '' : primaryCurrency,
    senderAddress,
    recipientAddress,
    secondaryCurrency:
      (isTokenCategory && !tokenFiatAmount) ||
      (!isUnifiedSwapTx &&
        [TransactionType.swap, TransactionType.swapAndSend].includes(type) &&
        !swapTokenFiatAmount) ||
      (isUnifiedSwapTx && !secondaryCurrency)
        ? undefined
        : secondaryCurrency,
    displayedStatusKey,
    isPending,
    isSubmitted,
    detailsTitle,
  };
}
