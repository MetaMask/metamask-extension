import { addHexPrefix, toChecksumAddress } from 'ethereumjs-util';
import abi from 'human-standard-token-abi';
import BigNumber from 'bignumber.js';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { getErrorMessage } from '../../../shared/modules/error';
import { GAS_LIMITS, MIN_GAS_LIMIT_HEX } from '../../../shared/constants/gas';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP } from '../../../shared/constants/network';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import { readAddressAsContract } from '../../../shared/modules/contract-utils';
import {
  addGasBuffer,
  generateERC20TransferData,
  generateERC721TransferData,
  generateERC1155TransferData,
  getAssetTransferData,
} from '../../pages/confirmations/send/send.utils';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import {
  checkNetworkAndAccountSupports1559,
  getConfirmationExchangeRates,
  getGasPriceInHexWei,
  getTokenExchangeRates,
} from '../../selectors';
import { estimateGas } from '../../store/actions';
import { Numeric } from '../../../shared/modules/Numeric';
import { getGasFeeEstimates, getNativeCurrency } from '../metamask/metamask';
import { getUsedSwapsGasPrice } from '../swaps/swaps';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../shared/constants/common';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

export async function estimateGasLimitForSend({
  selectedAddress,
  value,
  gasPrice,
  sendToken,
  to,
  data,
  isNonStandardEthChain,
  chainId,
  gasLimit,
  ...options
}) {
  let isSimpleSendOnNonStandardNetwork = false;

  // blockGasLimit may be a falsy, but defined, value when we receive it from
  // state, so we use logical or to fall back to MIN_GAS_LIMIT_HEX. Some
  // network implementations check the gas parameter supplied to
  // eth_estimateGas for validity. For this reason, we set token sends
  // blockGasLimit default to a higher number. Note that the current gasLimit
  // on a BLOCK is 15,000,000 and will be 30,000,000 on mainnet after London.
  // Meanwhile, MIN_GAS_LIMIT_HEX is 0x5208.
  let blockGasLimit = MIN_GAS_LIMIT_HEX;
  if (options.blockGasLimit) {
    blockGasLimit = options.blockGasLimit;
  } else if (sendToken) {
    blockGasLimit = GAS_LIMITS.BASE_TOKEN_ESTIMATE;
  }

  // The parameters below will be sent to our background process to estimate
  // how much gas will be used for a transaction. That background process is
  // located in tx-gas-utils.js in the transaction controller folder.
  const paramsForGasEstimate = { from: selectedAddress, value, gasPrice };

  if (sendToken) {
    if (!to) {
      // If no to address is provided, we cannot generate the token transfer
      // hexData. hexData in a transaction largely dictates how much gas will
      // be consumed by a transaction. We must use our best guess, which is
      // represented in the gas shared constants.
      return GAS_LIMITS.BASE_TOKEN_ESTIMATE;
    }
    paramsForGasEstimate.value = '0x0';

    // We have to generate the erc20/erc721 contract call to transfer tokens in
    // order to get a proper estimate for gasLimit.
    paramsForGasEstimate.data = getAssetTransferData({
      sendToken,
      fromAddress: selectedAddress,
      toAddress: to,
      amount: value,
    });

    paramsForGasEstimate.to = sendToken.address;
  } else {
    if (!data) {
      // eth.getCode will return the compiled smart contract code at the
      // address. If this returns 0x, 0x0 or a nullish value then the address
      // is an externally owned account (NOT a contract account). For these
      // types of transactions the gasLimit will always be 21,000 or 0x5208
      const { isContractAddress } = to
        ? await readAddressAsContract(global.eth, to)
        : {};
      if (!isContractAddress && !isNonStandardEthChain) {
        return GAS_LIMITS.SIMPLE;
      } else if (!isContractAddress && isNonStandardEthChain) {
        isSimpleSendOnNonStandardNetwork = true;
      }
    }

    paramsForGasEstimate.data = data;

    if (to) {
      paramsForGasEstimate.to = to;
    }

    if (!value || value === '0') {
      // TODO: Figure out what's going on here. According to eth_estimateGas
      // docs this value can be zero, or undefined, yet we are setting it to a
      // value here when the value is undefined or zero. For more context:
      // https://github.com/MetaMask/metamask-extension/pull/6195
      paramsForGasEstimate.value = '0xff';
    }
  }

  if (!isSimpleSendOnNonStandardNetwork) {
    // If we do not yet have a gasLimit, we must call into our background
    // process to get an estimate for gasLimit based on known parameters.
    paramsForGasEstimate.gas = new Numeric(blockGasLimit, 16)
      .times(new Numeric(0.95, 10))
      .round(0, BigNumber.ROUND_DOWN)
      .toPrefixedHexString();
  }

  // The buffer multipler reduces transaction failures by ensuring that the
  // estimated gas is always sufficient. Without the multiplier, estimates
  // for contract interactions can become inaccurate over time. This is because
  // gas estimation is non-deterministic. The gas required for the exact same
  // transaction call can change based on state of a contract or changes in the
  // contracts environment (blockchain data or contracts it interacts with).
  // Applying the 1.5 buffer has proven to be a useful guard against this non-
  // deterministic behaviour.
  //
  // Gas estimation of simple sends should, however, be deterministic. As such
  // no buffer is needed in those cases.
  let bufferMultiplier = 1.5;
  if (isSimpleSendOnNonStandardNetwork) {
    bufferMultiplier = 1;
  } else if (CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId]) {
    bufferMultiplier = CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId];
  }

  try {
    // Call into the background process that will simulate transaction
    // execution on the node and return an estimate of gasLimit
    const estimatedGasLimit = await estimateGas(paramsForGasEstimate);

    const estimateWithBuffer = addGasBuffer(
      estimatedGasLimit,
      blockGasLimit,
      bufferMultiplier,
    );
    return addHexPrefix(estimateWithBuffer);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const simulationFailed =
      errorMessage.includes('Transaction execution error.') ||
      errorMessage.includes(
        'gas required exceeds allowance or always failing transaction',
      ) ||
      (CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId] &&
        errorMessage.includes('gas required exceeds allowance'));
    if (simulationFailed) {
      const estimateWithBuffer = addGasBuffer(
        paramsForGasEstimate?.gas ?? gasLimit,
        blockGasLimit,
        bufferMultiplier,
      );
      return addHexPrefix(estimateWithBuffer);
    }
    throw error;
  }
}

export const addAdjustedReturnToQuotes = async (
  quotes,
  state,
  destinationAsset,
) => {
  if (!quotes?.length) {
    return quotes;
  }

  try {
    const chainId = getCurrentChainId(state);

    // get gas price
    const { medium, gasPrice: maybeGasFee } = getGasFeeEstimates(state);
    const networkAndAccountSupports1559 =
      checkNetworkAndAccountSupports1559(state);
    // remove this logic once getGasFeeEstimates is typed
    const gasFee1559 = maybeGasFee ?? medium?.suggestedMaxFeePerGas;
    const gasPriceNon1559 = getUsedSwapsGasPrice(state);
    const gasPrice = networkAndAccountSupports1559
      ? gasFee1559
      : gasPriceNon1559;

    // get exchange rates from state
    const contractExchangeRates = getTokenExchangeRates(state);
    const confirmationExchangeRates = getConfirmationExchangeRates(state);
    const mergedRates = {
      ...contractExchangeRates,
      ...confirmationExchangeRates,
    };

    const nativeCurrency = getNativeCurrency(state);
    const destinationAddress = destinationAsset?.address
      ? toChecksumAddress(destinationAsset.address)
      : undefined;

    // attempt to get the conversion rate from the state; native currency is 1
    let destToNativeConversionRate = destinationAddress
      ? mergedRates[destinationAddress]
      : 1;

    // if conversion rate isn't already in the state, fetch it
    if (!destToNativeConversionRate && destinationAddress) {
      destToNativeConversionRate = (
        await fetchTokenExchangeRates(
          nativeCurrency,
          [destinationAddress],
          chainId,
        )
      )[destinationAddress];
    }

    // if conversion rate isn't available, do not update the property
    if (!destToNativeConversionRate) {
      return quotes;
    }

    return quotes.map((quote) => {
      // get trade+approval
      const totalGasLimit =
        (quote?.gasParams.maxGas || 0) +
        Number(hexToDecimal(quote?.approvalNeeded?.gas || '0x0'));

      // get gas price in ETH (assuming mainnet for simplicity)
      const gasPriceInNative = new Numeric(gasPrice, 10, EtherDenomination.GWEI)
        .times(totalGasLimit, 10)
        .toDenomination(EtherDenomination.ETH);

      // convert token to ETH using conversion rate
      const destTokenReceivedInNative = quote.destinationAmount
        ? new Numeric(
            calcTokenAmount(
              quote.destinationAmount,
              destinationAsset?.decimals ||
                SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId].decimals,
            ),
            10,
          ).times(destToNativeConversionRate, 10)
        : undefined;

      // subtract gas ETH value from token ETH value
      const adjustAmountReceivedInNative = destTokenReceivedInNative
        .minus(gasPriceInNative)
        .toNumber();

      // add to quote
      return { ...quote, adjustAmountReceivedInNative };
    });
  } catch (error) {
    // no action is needed since we fallback from this property
    console.warn(
      `Could not calculate adjusted return for quote selection: ${error}`,
    );
  }
  return quotes;
};

export const calculateBestQuote = (quotesArray) =>
  quotesArray.reduce((best, current) => {
    const currentValue =
      current?.adjustAmountReceivedInNative ||
      Number(current?.destinationAmount || 0);
    const bestValue =
      best?.adjustAmountReceivedInNative ||
      Number(best?.destinationAmount || 0);

    return currentValue > bestValue ? current : best;
  }, quotesArray?.[0]);

/**
 * Generates a txParams from the send slice.
 *
 * @param {import('.').SendState} sendState - the state of the send slice
 * @returns {import('@metamask/transaction-controller').TransactionParams} A txParams object that can be used to create a transaction or
 *  update an existing transaction.
 */
export function generateTransactionParams(sendState) {
  const draftTransaction =
    sendState.draftTransactions[sendState.currentTransactionUUID];

  const txParams = {
    // If the fromAccount has been specified we use that, if not we use the
    // selected account.
    from:
      draftTransaction.fromAccount?.address ||
      sendState.selectedAccount.address,
    // gasLimit always needs to be set regardless of the asset being sent
    // or the type of transaction.
    gas: draftTransaction.gas.gasLimit,
  };

  switch (draftTransaction.sendAsset.type) {
    case AssetType.token:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = draftTransaction.sendAsset.details.address;
      txParams.value = '0x0';
      txParams.data = generateERC20TransferData({
        toAddress: draftTransaction.recipient.address,
        amount: draftTransaction.amount.value,
        sendToken: draftTransaction.sendAsset.details,
      });
      break;

    case AssetType.NFT:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = draftTransaction.sendAsset.details.address;
      txParams.value = '0x0';
      txParams.data =
        draftTransaction.sendAsset.details?.standard === TokenStandard.ERC721
          ? generateERC721TransferData({
              toAddress: draftTransaction.recipient.address,
              fromAddress:
                draftTransaction.fromAccount?.address ??
                sendState.selectedAccount.address,
              tokenId: draftTransaction.sendAsset.details.tokenId,
            })
          : generateERC1155TransferData({
              toAddress: draftTransaction.recipient.address,
              fromAddress:
                draftTransaction.fromAccount?.address ??
                sendState.selectedAccount.address,
              tokenId: draftTransaction.sendAsset.details.tokenId,
              amount: draftTransaction.amount.value,
            });
      break;
    case AssetType.native:
    default:
      // When sending native currency the to and value fields use the
      // recipient and amount values and the data key is either null or
      // populated with the user input provided in hex field.
      txParams.to = draftTransaction.recipient.address;
      txParams.value = draftTransaction.amount.value;
      txParams.data = draftTransaction.userInputHexData || '0x';
  }

  // We need to make sure that we only include the right gas fee fields
  // based on the type of transaction the network supports. We will also set
  // the type param here.
  if (sendState.eip1559support) {
    txParams.type = TransactionEnvelopeType.feeMarket;

    txParams.maxFeePerGas = draftTransaction.gas.maxFeePerGas;
    txParams.maxPriorityFeePerGas = draftTransaction.gas.maxPriorityFeePerGas;

    if (!txParams.maxFeePerGas || txParams.maxFeePerGas === '0x0') {
      txParams.maxFeePerGas = draftTransaction.gas.gasPrice;
    }

    if (
      !txParams.maxPriorityFeePerGas ||
      txParams.maxPriorityFeePerGas === '0x0'
    ) {
      txParams.maxPriorityFeePerGas = txParams.maxFeePerGas;
    }
  } else {
    txParams.gasPrice = draftTransaction.gas.gasPrice;
    txParams.type = TransactionEnvelopeType.legacy;
  }

  return txParams;
}

/**
 * This method is used to keep the original logic from the gas.duck.js file
 * after receiving a gasPrice from eth_gasPrice. First, the returned gasPrice
 * was converted to GWEI, then it was converted to a Number, then in the send
 * duck (here) we would use getGasPriceInHexWei to get back to hexWei. Now that
 * we receive a GWEI estimate from the controller, we still need to do this
 * weird conversion to get the proper rounding.
 *
 * @param {string} gasPriceEstimate
 * @returns {string}
 */
export function getRoundedGasPrice(gasPriceEstimate) {
  const gasPriceInDecGwei = new Numeric(gasPriceEstimate, 10)
    .round(9)
    .toString();
  const gasPriceAsNumber = Number(gasPriceInDecGwei);
  return getGasPriceInHexWei(gasPriceAsNumber);
}

export async function getERC20Balance(token, accountAddress) {
  const contract = global.eth.contract(abi).at(token.address);
  const usersToken = (await contract.balanceOf(accountAddress)) ?? null;
  if (!usersToken) {
    return '0x0';
  }
  const amount = calcTokenAmount(
    usersToken.balance.toString(),
    token.decimals,
  ).toString(16);
  return addHexPrefix(amount);
}

/**
 * returns if a given draft transaction is a swap and send
 *
 * @param {DraftTransaction} draftTransaction
 * @returns {boolean} true if the draft transaction is a swap and send
 */
export function getIsDraftSwapAndSend(draftTransaction) {
  return !isEqualCaseInsensitive(
    draftTransaction?.sendAsset?.details?.address || '',
    draftTransaction?.receiveAsset?.details?.address || '',
  );
}
