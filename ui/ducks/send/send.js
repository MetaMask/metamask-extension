import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import abi from 'human-standard-token-abi';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';
import { debounce } from 'lodash';
import {
  conversionGreaterThan,
  conversionUtil,
  multiplyCurrencies,
  subtractCurrencies,
} from '../../../shared/modules/conversion.utils';
import { GAS_ESTIMATE_TYPES, GAS_LIMITS } from '../../../shared/constants/gas';
import {
  CONTRACT_ADDRESS_ERROR,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  MIN_GAS_LIMIT_HEX,
  NEGATIVE_ETH_ERROR,
} from '../../pages/send/send.constants';

import {
  addGasBuffer,
  calcGasTotal,
  generateERC20TransferData,
  generateERC721TransferData,
  getAssetTransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
} from '../../pages/send/send.utils';
import {
  getAddressBookEntry,
  getAdvancedInlineGasShown,
  getCurrentChainId,
  getGasPriceInHexWei,
  getIsMainnet,
  getSelectedAddress,
  getTargetAccount,
  getIsNonStandardEthChain,
  checkNetworkAndAccountSupports1559,
  getUseTokenDetection,
  getTokenList,
  getAddressBookEntryOrAccountName,
  getIsMultiLayerFeeNetwork,
} from '../../selectors';
import {
  disconnectGasFeeEstimatePoller,
  displayWarning,
  estimateGas,
  getGasFeeEstimatesAndStartPolling,
  hideLoadingIndication,
  showLoadingIndication,
  updateEditableParams,
  updateTransactionGasFees,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
  isCollectibleOwner,
  getTokenStandardAndDetails,
  showModal,
  addUnapprovedTransactionAndRouteToConfirmationPage,
  updateTransactionSendFlowHistory,
} from '../../store/actions';
import { setCustomGasLimit } from '../gas/gas.duck';
import {
  QR_CODE_DETECTED,
  SELECTED_ACCOUNT_CHANGED,
  ACCOUNT_CHANGED,
  ADDRESS_BOOK_UPDATED,
  GAS_FEE_ESTIMATES_UPDATED,
} from '../../store/actionConstants';
import {
  calcTokenAmount,
  getTokenAddressParam,
  getTokenValueParam,
} from '../../helpers/utils/token-util';
import {
  checkExistingAddresses,
  isDefaultMetaMaskChain,
  isOriginContractAddress,
  isValidDomainName,
} from '../../helpers/utils/util';
import {
  getGasEstimateType,
  getTokens,
  getUnapprovedTxs,
} from '../metamask/metamask';

import { resetEnsResolution } from '../ens';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../shared/modules/hexstring-utils';
import { sumHexes } from '../../helpers/utils/transactions.util';
import fetchEstimatedL1Fee from '../../helpers/utils/optimism/fetchEstimatedL1Fee';

import { CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP } from '../../../shared/constants/network';
import { TOKEN_STANDARDS, ETH, GWEI } from '../../helpers/constants/common';
import {
  ASSET_TYPES,
  TRANSACTION_ENVELOPE_TYPES,
  TRANSACTION_TYPES,
} from '../../../shared/constants/transaction';
import { readAddressAsContract } from '../../../shared/modules/contract-utils';
import { INVALID_ASSET_TYPE } from '../../helpers/constants/error-keys';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { getValueFromWeiHex } from '../../helpers/utils/confirm-tx.util';
// typedef import statements
/**
 * @typedef {(
 *  import('immer/dist/internal').WritableDraft<SendState>
 * )} SendStateDraft
 * @typedef {(
 *  import('../../../shared/constants/transaction').AssetTypesString
 * )} AssetTypesString
 * @typedef {(
 *  import( '../../helpers/constants/common').TokenStandardStrings
 * )} TokenStandardStrings
 * @typedef {(
 *  import('../../../shared/constants/transaction').TransactionTypeString
 * )} TransactionTypeString
 * @typedef {(
 *  import('@metamask/controllers').LegacyGasPriceEstimate
 * )} LegacyGasPriceEstimate
 * @typedef {(
 *  import('@metamask/controllers').GasFeeEstimates
 * )} GasFeeEstimates
 * @typedef {(
 *  import('@metamask/controllers').EthGasPriceEstimate
 * )} EthGasPriceEstimate
 * @typedef {(
 *  import('@metamask/controllers').GasEstimateType
 * )} GasEstimateType
 */

const name = 'send';

/**
 * @typedef {Object} SendStateStages
 * @property {'INACTIVE'} INACTIVE - The send state is idle, and hasn't yet
 *  fetched required data for gasPrice and gasLimit estimations, etc.
 * @property {'ADD_RECIPIENT'} ADD_RECIPIENT - The user is selecting which
 *  address to send an asset to.
 * @property {'DRAFT'} DRAFT - The send form is shown for a transaction yet to
 *  be sent to the Transaction Controller.
 * @property {'EDIT'} EDIT - The send form is shown for a transaction already
 *  submitted to the Transaction Controller but not yet confirmed. This happens
 *  when a confirmation is shown for a transaction and the 'edit' button in the
 *  header is clicked.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above Stages
 *
 * @typedef {SendStateStages[keyof SendStateStages]} SendStateStagesStrings
 */

/**
 * The Stages that the send slice can be in
 *
 * @type {SendStateStages}
 */
export const SEND_STAGES = {
  INACTIVE: 'INACTIVE',
  ADD_RECIPIENT: 'ADD_RECIPIENT',
  DRAFT: 'DRAFT',
  EDIT: 'EDIT',
};

/**
 * @typedef {Object} SendStateStatuses
 * @property {'VALID'} VALID - The transaction is valid and can be submitted.
 * @property {'INVALID'} INVALID - The transaction is invalid and cannot be
 *  submitted. There are a number of cases that would result in an invalid
 *  send state:
 *  1. The recipient is not yet defined
 *  2. The amount + gasTotal is greater than the user's balance when sending
 *     native currency
 *  3. The gasTotal is greater than the user's *native* balance
 *  4. The amount of sent asset is greater than the user's *asset* balance
 *  5. Gas price estimates failed to load entirely
 *  6. The gasLimit is less than 21000 (0x5208)
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above statuses
 *
 * @typedef {SendStateStatuses[keyof SendStateStatuses]} SendStateStatusStrings
 */

/**
 * The status of the send slice
 *
 * @type {SendStateStatuses}
 */
export const SEND_STATUSES = {
  VALID: 'VALID',
  INVALID: 'INVALID',
};

/**
 * @typedef {Object} SendStateGasModes
 * @property {'BASIC'} BASIC - Shows the basic estimate slow/avg/fast buttons
 *  when on mainnet and the metaswaps API request is successful.
 * @property {'INLINE'} INLINE - Shows inline gasLimit/gasPrice fields when on
 *  any other network or metaswaps API fails and we use eth_gasPrice.
 * @property {'CUSTOM'} CUSTOM - Shows GasFeeDisplay component that is a read
 *  only display of the values the user has set in the advanced gas modal
 *  (stored in the gas duck under the customData key).
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above gas modes
 *
 * @typedef {SendStateGasModes[keyof SendStateGasModes]} SendStateGasModeStrings
 */

/**
 * Controls what is displayed in the send-gas-row component.
 *
 * @type {SendStateGasModes}
 */
export const GAS_INPUT_MODES = {
  BASIC: 'BASIC',
  INLINE: 'INLINE',
  CUSTOM: 'CUSTOM',
};

/**
 * @typedef {Object} SendStateAmountModes
 * @property {'INPUT'} INPUT - the user provides the amount by typing in the
 *  field.
 * @property {'MAX'} MAX - The user selects the MAX button and amount is
 *  calculated based on balance - (amount + gasTotal).
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above gas modes
 *
 * @typedef {SendStateAmountModes[keyof SendStateAmountModes]} SendStateAmountModeStrings
 */

/**
 * The modes that the amount field can be set by
 *
 * @type {SendStateAmountModes}
 */
export const AMOUNT_MODES = {
  INPUT: 'INPUT',
  MAX: 'MAX',
};

/**
 * @typedef {Object} SendStateRecipientModes
 * @property {'MY_ACCOUNTS'} MY_ACCOUNTS - the user is displayed a list of
 *  their own accounts to send to.
 * @property {'CONTACT_LIST'} CONTACT_LIST - The user is displayed a list of
 *  their contacts and addresses they have recently send to.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above recipient modes
 *
 * @typedef {SendStateRecipientModes[keyof SendStateRecipientModes]} SendStateRecipientModeStrings
 */

/**
 * The type of recipient list that is displayed to user
 *
 * @type {SendStateRecipientModes}
 */
export const RECIPIENT_SEARCH_MODES = {
  MY_ACCOUNTS: 'MY_ACCOUNTS',
  CONTACT_LIST: 'CONTACT_LIST',
};

async function estimateGasLimitForSend({
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
      // if no to address is provided, we cannot generate the token transfer
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

    paramsForGasEstimate.gas = addHexPrefix(
      multiplyCurrencies(blockGasLimit, 0.95, {
        multiplicandBase: 16,
        multiplierBase: 10,
        roundDown: '0',
        toNumericBase: 'hex',
      }),
    );
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
    // call into the background process that will simulate transaction
    // execution on the node and return an estimate of gasLimit
    const estimatedGasLimit = await estimateGas(paramsForGasEstimate);
    const estimateWithBuffer = addGasBuffer(
      estimatedGasLimit,
      blockGasLimit,
      bufferMultiplier,
    );
    return addHexPrefix(estimateWithBuffer);
  } catch (error) {
    const simulationFailed =
      error.message.includes('Transaction execution error.') ||
      error.message.includes(
        'gas required exceeds allowance or always failing transaction',
      ) ||
      (CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId] &&
        error.message.includes('gas required exceeds allowance'));
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

// After modification of specific fields in specific circumstances we must
// recompute the gasLimit estimate to be as accurate as possible. the cases
// that necessitate this logic are listed below:
// 1. when the amount sent changes when sending a token due to the amount being
//    part of the hex encoded data property of the transaction.
// 2. when updating the data property while sending NATIVE currency (ex: ETH)
//    because the data parameter defines function calls that the EVM will have
//    to execute which is where a large chunk of gas is potentially consumed.
// 3. when the recipient changes while sending a token due to the recipient's
//    address being included in the hex encoded data property of the
//    transaction
// 4. when the asset being sent changes due to the contract address and details
//    of the token being included in the hex encoded data property of the
//    transaction. If switching to NATIVE currency (ex: ETH), the gasLimit will
//    change due to hex data being removed (unless supplied by user).
// This method computes the gasLimit estimate which is written to state in an
// action handler in extraReducers.
export const computeEstimatedGasLimit = createAsyncThunk(
  'send/computeEstimatedGasLimit',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const { send, metamask } = state;
    const unapprovedTxs = getUnapprovedTxs(state);
    const isMultiLayerFeeNetwork = getIsMultiLayerFeeNetwork(state);
    const transaction = unapprovedTxs[send.id];
    const isNonStandardEthChain = getIsNonStandardEthChain(state);
    const chainId = getCurrentChainId(state);

    let layer1GasTotal;
    if (isMultiLayerFeeNetwork) {
      layer1GasTotal = await fetchEstimatedL1Fee(global.eth, {
        txParams: {
          gasPrice: send.gas.gasPrice,
          gas: send.gas.gasLimit,
          to: send.recipient.address?.toLowerCase(),
          value:
            send.amount.mode === 'MAX'
              ? send.account.balance
              : send.amount.value,
          from: send.account.address,
          data: send.userInputHexData,
          type: '0x0',
        },
      });
    }

    if (
      send.stage !== SEND_STAGES.EDIT ||
      !transaction.dappSuggestedGasFees?.gas ||
      !transaction.userEditedGasLimit
    ) {
      const gasLimit = await estimateGasLimitForSend({
        gasPrice: send.gas.gasPrice,
        blockGasLimit: metamask.currentBlockGasLimit,
        selectedAddress: metamask.selectedAddress,
        sendToken: send.asset.details,
        to: send.recipient.address?.toLowerCase(),
        value: send.amount.value,
        data: send.userInputHexData,
        isNonStandardEthChain,
        chainId,
        gasLimit: send.gas.gasLimit,
      });
      await thunkApi.dispatch(setCustomGasLimit(gasLimit));
      return {
        gasLimit,
        layer1GasTotal,
      };
    }
    return null;
  },
);

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
function getRoundedGasPrice(gasPriceEstimate) {
  const gasPriceInDecGwei = conversionUtil(gasPriceEstimate, {
    numberOfDecimals: 9,
    toDenomination: GWEI,
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: ETH,
    fromDenomination: GWEI,
  });
  const gasPriceAsNumber = Number(gasPriceInDecGwei);
  return getGasPriceInHexWei(gasPriceAsNumber);
}

/**
 * Responsible for initializing required state for the send slice.
 * This method is dispatched from the send page in the componentDidMount
 * method. It is also dispatched anytime the network changes to ensure that
 * the slice remains valid with changing token and account balances. To do so
 * it keys into state to get necessary values and computes a starting point for
 * the send slice. It returns the values that might change from this action and
 * those values are written to the slice in the `initializeSendState.fulfilled`
 * action handler.
 */
export const initializeSendState = createAsyncThunk(
  'send/initializeSendState',
  async (_, thunkApi) => {
    const state = thunkApi.getState();
    const isNonStandardEthChain = getIsNonStandardEthChain(state);
    const chainId = getCurrentChainId(state);
    const eip1559support = checkNetworkAndAccountSupports1559(state);
    const {
      send: { asset, stage, recipient, amount, userInputHexData },
      metamask,
    } = state;

    // First determine the correct from address. For new sends this is always
    // the currently selected account and switching accounts switches the from
    // address. If editing an existing transaction (by clicking 'edit' on the
    // send page), the fromAddress is always the address from the txParams.
    const fromAddress =
      stage === SEND_STAGES.EDIT
        ? state.send.account.address
        : metamask.selectedAddress;
    // We need the account's balance which is calculated from cachedBalances in
    // the getMetaMaskAccounts selector. getTargetAccount consumes this
    // selector and returns the account at the specified address.
    const account = getTargetAccount(state, fromAddress);

    // Default gasPrice to 1 gwei if all estimation fails, this is only used
    // for gasLimit estimation and won't be set directly in state. Instead, we
    // will return the gasFeeEstimates and gasEstimateType so that the reducer
    // can set the appropriate gas fees in state.
    let gasPrice = '0x1';
    let gasEstimatePollToken = null;

    // Instruct the background process that polling for gas prices should begin
    gasEstimatePollToken = await getGasFeeEstimatesAndStartPolling();

    addPollingTokenToAppState(gasEstimatePollToken);

    const {
      metamask: { gasFeeEstimates, gasEstimateType },
    } = thunkApi.getState();

    // Because we are only interested in getting a gasLimit estimation we only
    // need to worry about gasPrice. So we use maxFeePerGas as gasPrice if we
    // have a fee market estimation.
    if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      gasPrice = getGasPriceInHexWei(gasFeeEstimates.medium);
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
      gasPrice = getRoundedGasPrice(gasFeeEstimates.gasPrice);
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      gasPrice = getGasPriceInHexWei(
        gasFeeEstimates.medium.suggestedMaxFeePerGas,
      );
    } else {
      gasPrice = gasFeeEstimates.gasPrice
        ? getRoundedGasPrice(gasFeeEstimates.gasPrice)
        : '0x0';
    }

    // Set a basic gasLimit in the event that other estimation fails
    let gasLimit =
      asset.type === ASSET_TYPES.TOKEN || asset.type === ASSET_TYPES.COLLECTIBLE
        ? GAS_LIMITS.BASE_TOKEN_ESTIMATE
        : GAS_LIMITS.SIMPLE;
    if (
      gasEstimateType !== GAS_ESTIMATE_TYPES.NONE &&
      stage !== SEND_STAGES.EDIT &&
      recipient.address
    ) {
      // Run our estimateGasLimit logic to get a more accurate estimation of
      // required gas. If this value isn't nullish, set it as the new gasLimit
      const estimatedGasLimit = await estimateGasLimitForSend({
        gasPrice,
        blockGasLimit: metamask.currentBlockGasLimit,
        selectedAddress: fromAddress,
        sendToken: asset.details,
        to: recipient.address.toLowerCase(),
        value: amount.value,
        data: userInputHexData,
        isNonStandardEthChain,
        chainId,
      });
      gasLimit = estimatedGasLimit || gasLimit;
    }
    // We have to keep the gas slice in sync with the send slice state
    // so that it'll be initialized correctly if the gas modal is opened.
    await thunkApi.dispatch(setCustomGasLimit(gasLimit));
    // We must determine the balance of the asset that the transaction will be
    // sending. This is done by referencing the native balance on the account
    // for native assets, and calling the balanceOf method on the ERC20
    // contract for token sends.
    let { balance } = account;
    if (asset.type === ASSET_TYPES.TOKEN) {
      if (asset.details === null) {
        // If we're sending a token but details have not been provided we must
        // abort and set the send slice into invalid status.
        throw new Error(
          'Send slice initialized as token send without token details',
        );
      }
      balance = await getERC20Balance(asset.details, fromAddress);
    }

    if (asset.type === ASSET_TYPES.COLLECTIBLE) {
      if (asset.details === null) {
        // If we're sending a collectible but details have not been provided we must
        // abort and set the send slice into invalid status.
        throw new Error(
          'Send slice initialized as collectibles send without token details',
        );
      }
      balance = '0x1';
    }
    return {
      address: fromAddress,
      nativeBalance: account.balance,
      assetBalance: balance,
      chainId: getCurrentChainId(state),
      tokens: getTokens(state),
      gasFeeEstimates,
      gasEstimateType,
      gasLimit,
      gasTotal: addHexPrefix(calcGasTotal(gasLimit, gasPrice)),
      gasEstimatePollToken,
      eip1559support,
      useTokenDetection: getUseTokenDetection(state),
      tokenAddressList: Object.keys(getTokenList(state)),
    };
  },
);

/**
 * @typedef {Object} SendState
 * @property {string} [id] - The id of a transaction that is being edited
 * @property {SendStateStagesStrings} stage - The stage of the send flow that
 *  the user has progressed to. Defaults to 'INACTIVE' which results in the
 *  send screen not being shown.
 * @property {SendStateStatusStrings} status - The status of the send slice
 *  which will be either 'VALID' or 'INVALID'
 * @property {string} transactionType - Determines type of transaction being
 *  sent, defaulted to 0x0 (legacy).
 * @property {boolean} eip1559support - tracks whether the current network
 *  supports EIP 1559 transactions.
 * @property {Object} account - Details about the user's account.
 * @property {string} [account.address] - from account address, defaults to
 *  selected account. will be the account the original transaction was sent
 *  from in the case of the EDIT stage.
 * @property {string} [account.balance] - Hex string representing the balance
 *  of the from account.
 * @property {string} [userInputHexData] - When a user has enabled custom hex
 *  data field in advanced options, they can supply data to the field which is
 *  stored under this key.
 * @property {Object} gas - Details about the current gas settings
 * @property {boolean} gas.isGasEstimateLoading - Indicates whether the gas
 *  estimate is loading.
 * @property {string} [gas.gasEstimatePollToken] - String token identifying a
 *  listener for polling on the gasFeeController
 * @property {boolean} gas.isCustomGasSet - true if the user set custom gas in
 *  the custom gas modal
 * @property {string} gas.gasLimit - maximum gas needed for tx.
 * @property {string} gas.gasPrice - price in wei to pay per gas.
 * @property {string} gas.maxFeePerGas - Maximum price in wei to pay per gas.
 * @property {string} gas.maxPriorityFeePerGas - Maximum priority fee in wei to
 *  pay per gas.
 * @property {string} gas.gasPriceEstimate - Expected price in wei necessary to
 *  pay per gas used for a transaction to be included in a reasonable timeframe.
 *  Comes from the GasFeeController.
 * @property {string} gas.gasTotal - maximum total price in wei to pay.
 * @property {string} gas.minimumGasLimit - minimum supported gasLimit.
 * @property {string} [gas.error] - error to display for gas fields.
 * @property {Object} amount - An object containing information about the
 *  amount of currency to send.
 * @property {SendStateAmountModeStrings} amount.mode - Describe whether the
 *  user has manually input an amount or if they have selected max to send the
 *  maximum amount of the selected currency.
 * @property {string} amount.value - A hex string representing the amount of
 *  the selected currency to send.
 * @property {string} [amount.error] - Error to display for the amount field.
 * @property {Object} asset - An object that describes the asset that the user
 *  has selected to send.
 * @property {AssetTypesString} asset.type - The type of asset that the user
 *  is attempting to send. Defaults to 'NATIVE' which represents the native
 *  asset of the chain. Can also be 'TOKEN' or 'COLLECTIBLE'.
 * @property {string} asset.balance - A hex string representing the balance
 *  that the user holds of the asset that they are attempting to send.
 * @property {Object} [asset.details] - An object that describes the selected
 *  asset in the case that the user is sending a token or collectibe. Will be
 *  null when asset.type is 'NATIVE'.
 * @property {string} [asset.details.address] - The address of the selected
 *  'TOKEN' or 'COLLECTIBLE' contract.
 * @property {string} [asset.details.symbol] - The symbol of the selected
 *  asset.
 * @property {number} [asset.details.decimals] - The number of decimals of the
 *  selected 'TOKEN' asset.
 * @property {number} [asset.details.tokenId] - The id of the selected
 *  'COLLECTIBLE' asset.
 * @property {TokenStandardStrings} [asset.details.standard] - The standard
 *  of the selected 'TOKEN' or 'COLLECTIBLE' asset.
 * @property {boolean} [asset.details.isERC721] - True when the asset is a
 *  ERC721 token.
 * @property {string} [asset.error] - Error to display when there is an issue
 *  with the asset.
 * @property {Object} recipient - An object that describes the intended
 *  recipient of the transaction.
 * @property {SendStateRecipientModeStrings} recipient.mode - Describes which
 *  list of recipients the user is shown on the add recipient screen. When this
 *  key is set to 'MY_ACCOUNTS' the user is shown the list of accounts they
 *  own. When it is 'CONTACT_LIST' the user is shown the list of contacts they
 *  have saved in MetaMask and any addresses they have recently sent to.
 * @property {string} recipient.address - The fully qualified address of the
 *  recipient. This is set after the recipient.userInput is validated, the
 *  userInput field is quickly updated to avoid delay between keystrokes and
 *  seeing the input field updated. After a debounc the address typed is
 *  validated and then the address field is updated. The address field is also
 *  set when the user selects a contact or account from the list, or an ENS
 *  resolution when typing ENS names.
 * @property {string} recipient.userInput - The user input of the recipient
 *  which is updated quickly to avoid delays in the UI reflecting manual entry
 *  of addresses.
 * @property {string} recipient.nickname - The nickname that the user has added
 *  to their address book for the recipient.address.
 * @property {string} [recipient.error] - Error to display on the address field.
 * @property {string} [recipient.warning] - Warning to display on the address
 *  field.
 * @property {Object} multiLayerFees - An object containing attributes for use
 *  on chains that have layer 1 and layer 2 fees to consider for gas
 *  calculations.
 * @property {string} multiLayerFees.layer1GasTotal -  Layer 1 gas fee total on
 *  multi-layer fee networks
 * @property {Array<{event: string, timestamp: number}>} history - An array of
 *  entries that describe the user's journey through the send flow. This is
 *  sent to the controller for attaching to state logs for troubleshooting and
 *  support.
 */

/**
 * @type {SendState}
 */
export const initialState = {
  id: null,
  stage: SEND_STAGES.INACTIVE,
  status: SEND_STATUSES.VALID,
  transactionType: TRANSACTION_ENVELOPE_TYPES.LEGACY,
  eip1559support: false,
  account: {
    address: null,
    balance: '0x0',
  },
  userInputHexData: null,
  gas: {
    isGasEstimateLoading: true,
    gasEstimatePollToken: null,
    isCustomGasSet: false,
    gasLimit: '0x0',
    gasPrice: '0x0',
    maxFeePerGas: '0x0',
    maxPriorityFeePerGas: '0x0',
    gasPriceEstimate: '0x0',
    gasTotal: '0x0',
    minimumGasLimit: GAS_LIMITS.SIMPLE,
    error: null,
  },
  amount: {
    mode: AMOUNT_MODES.INPUT,
    value: '0x0',
    error: null,
  },
  asset: {
    type: ASSET_TYPES.NATIVE,
    balance: '0x0',
    details: null,
    error: null,
  },
  recipient: {
    mode: RECIPIENT_SEARCH_MODES.CONTACT_LIST,
    userInput: '',
    address: '',
    nickname: '',
    error: null,
    warning: null,
  },
  multiLayerFees: {
    layer1GasTotal: '0x0',
  },
  history: [],
};

/**
 * Generates a txParams from the send slice.
 *
 * @param {SendState} state - the Send slice state
 * @returns {import(
 *  '../../../shared/constants/transaction'
 * ).TxParams} A txParams object that can be used to create a transaction or
 *  update an existing transaction.
 */
function generateTransactionParams(state) {
  const txParams = {
    from: state.account.address,
    // gasLimit always needs to be set regardless of the asset being sent
    // or the type of transaction.
    gas: state.gas.gasLimit,
  };
  switch (state.asset.type) {
    case ASSET_TYPES.TOKEN:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = state.asset.details.address;
      txParams.value = '0x0';
      txParams.data = generateERC20TransferData({
        toAddress: state.recipient.address,
        amount: state.amount.value,
        sendToken: state.asset.details,
      });
      break;
    case ASSET_TYPES.COLLECTIBLE:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = state.asset.details.address;
      txParams.value = '0x0';
      txParams.data = generateERC721TransferData({
        toAddress: state.recipient.address,
        fromAddress: state.account.address,
        tokenId: state.asset.details.tokenId,
      });
      break;
    case ASSET_TYPES.NATIVE:
    default:
      // When sending native currency the to and value fields use the
      // recipient and amount values and the data key is either null or
      // populated with the user input provided in hex field.
      txParams.to = state.recipient.address;
      txParams.value = state.amount.value;
      txParams.data = state.userInputHexData ?? undefined;
  }

  // We need to make sure that we only include the right gas fee fields
  // based on the type of transaction the network supports. We will also set
  // the type param here.
  if (state.eip1559support) {
    txParams.type = TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;

    txParams.maxFeePerGas = state.gas.maxFeePerGas;
    txParams.maxPriorityFeePerGas = state.gas.maxPriorityFeePerGas;

    if (!txParams.maxFeePerGas || txParams.maxFeePerGas === '0x0') {
      txParams.maxFeePerGas = state.gas.gasPrice;
    }

    if (
      !txParams.maxPriorityFeePerGas ||
      txParams.maxPriorityFeePerGas === '0x0'
    ) {
      txParams.maxPriorityFeePerGas = txParams.maxFeePerGas;
    }
  } else {
    txParams.gasPrice = state.gas.gasPrice;
    txParams.type = TRANSACTION_ENVELOPE_TYPES.LEGACY;
  }

  return txParams;
}

const slice = createSlice({
  name,
  initialState,
  reducers: {
    addHistoryEntry: (state, action) => {
      state.history.push({
        entry: action.payload,
        timestamp: Date.now(),
      });
    },
    /**
     * update current amount.value in state and run post update validation of
     * the amount field and the send state.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action - The
     *  hex string to be set as the amount value.
     */
    updateSendAmount: (state, action) => {
      state.amount.value = addHexPrefix(action.payload);
      // Once amount has changed, validate the field
      slice.caseReducers.validateAmountField(state);
      if (state.asset.type === ASSET_TYPES.NATIVE) {
        // if sending the native asset the amount being sent will impact the
        // gas field as well because the gas validation takes into
        // consideration the available balance minus amount sent before
        // checking if there is enough left to cover the gas fee.
        slice.caseReducers.validateGasField(state);
      }
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    /**
     * computes the maximum amount of asset that can be sent and then calls
     * the updateSendAmount action above with the computed value, which will
     * revalidate the field and form.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     */
    updateAmountToMax: (state) => {
      let amount = '0x0';
      if (state.asset.type === ASSET_TYPES.TOKEN) {
        const decimals = state.asset.details?.decimals ?? 0;
        const multiplier = Math.pow(10, Number(decimals));

        amount = multiplyCurrencies(state.asset.balance, multiplier, {
          toNumericBase: 'hex',
          multiplicandBase: 16,
          multiplierBase: 10,
        });
      } else {
        const _gasTotal = sumHexes(
          state.gas.gasTotal || '0x0',
          state.multiLayerFees?.layer1GasTotal || '0x0',
        );
        amount = subtractCurrencies(
          addHexPrefix(state.asset.balance),
          addHexPrefix(_gasTotal),
          {
            toNumericBase: 'hex',
            aBase: 16,
            bBase: 16,
          },
        );
      }
      slice.caseReducers.updateSendAmount(state, {
        payload: amount,
      });
    },
    /**
     * updates the userInputHexData state key
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action - The
     *  hex string to be set as the userInputHexData value.
     */
    updateUserInputHexData: (state, action) => {
      state.userInputHexData = action.payload;
    },
    /**
     * Transaction details of a previously created transaction that the user
     * has selected to edit.
     *
     * @typedef {Object} EditTransactionPayload
     * @property {string} gasLimit - The hex string maximum gas to use.
     * @property {string} gasPrice - The amount in wei to pay for gas, in hex
     *  format.
     * @property {string} amount - The amount of the currency to send, in hex
     *  format.
     * @property {string} address - The address to send the transaction to.
     * @property {string} [nickname] - The nickname the user has associated
     *  with the address in their contact book.
     * @property {string} id - The id of the transaction in the
     *  TransactionController state[
     * @property {string} from - the address that the user is sending from
     * @property {string} [data] - The hex data that describes the transaction.
     *  Used primarily for contract interactions, like token sends, but can
     *  also be provided by the user.
     */
    /**
     * Initiates the edit transaction flow by setting the stage to 'EDIT' and
     * then pulling the details of the previously submitted transaction from
     * the action payload.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import(
     *  '@reduxjs/toolkit'
     * ).PayloadAction<EditTransactionPayload>} action - The details of the
     *  transaction to be edited.
     */
    editTransaction: (state, action) => {
      state.stage = SEND_STAGES.EDIT;
      state.gas.gasLimit = action.payload.gasLimit;
      state.gas.gasPrice = action.payload.gasPrice;
      state.amount.value = action.payload.amount;
      state.gas.error = null;
      state.amount.error = null;
      state.asset.error = null;
      state.recipient.address = action.payload.address;
      state.recipient.nickname = action.payload.nickname;
      state.id = action.payload.id;
      state.account.address = action.payload.from;
      state.userInputHexData = action.payload.data;
    },
    /**
     * gasTotal is computed based on gasPrice and gasLimit and set in state
     * recomputes the maximum amount if the current amount mode is 'MAX' and
     * sending the native token. ERC20 assets max amount is unaffected by
     * gasTotal so does not need to be recomputed. Finally, validates the gas
     * field and send state.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     */
    calculateGasTotal: (state) => {
      // use maxFeePerGas as the multiplier if working with a FEE_MARKET transaction
      // otherwise use gasPrice
      if (state.transactionType === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET) {
        state.gas.gasTotal = addHexPrefix(
          calcGasTotal(state.gas.gasLimit, state.gas.maxFeePerGas),
        );
      } else {
        state.gas.gasTotal = addHexPrefix(
          calcGasTotal(state.gas.gasLimit, state.gas.gasPrice),
        );
      }
      if (
        state.amount.mode === AMOUNT_MODES.MAX &&
        state.asset.type === ASSET_TYPES.NATIVE
      ) {
        slice.caseReducers.updateAmountToMax(state);
      }
      slice.caseReducers.validateAmountField(state);
      slice.caseReducers.validateGasField(state);
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    /**
     * sets the provided gasLimit in state and then recomputes the gasTotal.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action - The
     *  gasLimit in hex to set in state.
     */
    updateGasLimit: (state, action) => {
      state.gas.gasLimit = addHexPrefix(action.payload);
      slice.caseReducers.calculateGasTotal(state);
    },
    /**
     * @typedef {Object} GasFeeUpdatePayload
     * @property {TransactionTypeString} transactionType - The transaction type
     * @property {string} [maxFeePerGas] - The maximum amount in hex wei to pay
     *  per gas on a FEE_MARKET transaction.
     * @property {string} [maxPriorityFeePerGas] - The maximum amount in hex
     *  wei to pay per gas as an incentive to miners on a FEE_MARKET
     *  transaction.
     * @property {string} [gasPrice] - The amount in hex wei to pay per gas on
     *  a LEGACY transaction.
     * @property {boolean} [isAutomaticUpdate] - true if the update is the
     *  result of a gas estimate update from the controller.
     */
    /**
     * Sets the appropriate gas fees in state and determines and sets the
     * appropriate transactionType based on gas fee fields received.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import(
     *  '@reduxjs/toolkit'
     * ).PayloadAction<GasFeeUpdatePayload>} action
     */
    updateGasFees: (state, action) => {
      if (
        action.payload.transactionType === TRANSACTION_ENVELOPE_TYPES.FEE_MARKET
      ) {
        state.gas.maxFeePerGas = addHexPrefix(action.payload.maxFeePerGas);
        state.gas.maxPriorityFeePerGas = addHexPrefix(
          action.payload.maxPriorityFeePerGas,
        );
        state.transactionType = TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
      } else {
        // Until we remove the old UI we don't want to automatically update
        // gasPrice if the user has already manually changed the field value.
        // When receiving a new estimate the isAutomaticUpdate property will be
        // on the payload (and set to true). If isAutomaticUpdate is true,
        // then we check if the previous estimate was '0x0' or if the previous
        // gasPrice equals the previous gasEstimate. if either of those cases
        // are true then we update the gasPrice otherwise we skip it because
        // it indicates the user has ejected from the estimates by modifying
        // the field.
        if (
          action.payload.isAutomaticUpdate !== true ||
          state.gas.gasPriceEstimate === '0x0' ||
          state.gas.gasPrice === state.gas.gasPriceEstimate
        ) {
          state.gas.gasPrice = addHexPrefix(action.payload.gasPrice);
        }
        state.transactionType = TRANSACTION_ENVELOPE_TYPES.LEGACY;
      }
      slice.caseReducers.calculateGasTotal(state);
    },
    /**
     * @typedef {Object} GasEstimateUpdatePayload
     * @property {GasEstimateType} gasEstimateType - The type of gas estimation
     *  provided by the controller.
     * @property {(
     *  EthGasPriceEstimate | LegacyGasPriceEstimate | GasFeeEstimates
     * )} gasFeeEstimates - The gas fee estimates provided by the controller.
     */
    /**
     * Sets the appropriate gas fees in state after receiving new estimates.
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {(
     *  import('@reduxjs/toolkit').PayloadAction<GasEstimateUpdatePayload
     * )} action - The gas fee update payload
     */
    updateGasFeeEstimates: (state, action) => {
      const { gasFeeEstimates, gasEstimateType } = action.payload;
      let gasPriceEstimate = '0x0';
      switch (gasEstimateType) {
        case GAS_ESTIMATE_TYPES.FEE_MARKET:
          slice.caseReducers.updateGasFees(state, {
            payload: {
              transactionType: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
              maxFeePerGas: getGasPriceInHexWei(
                gasFeeEstimates.medium.suggestedMaxFeePerGas,
              ),
              maxPriorityFeePerGas: getGasPriceInHexWei(
                gasFeeEstimates.medium.suggestedMaxPriorityFeePerGas,
              ),
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.LEGACY:
          gasPriceEstimate = getRoundedGasPrice(gasFeeEstimates.medium);
          slice.caseReducers.updateGasFees(state, {
            payload: {
              gasPrice: gasPriceEstimate,
              type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
              isAutomaticUpdate: true,
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.ETH_GASPRICE:
          gasPriceEstimate = getRoundedGasPrice(gasFeeEstimates.gasPrice);
          slice.caseReducers.updateGasFees(state, {
            payload: {
              gasPrice: getRoundedGasPrice(gasFeeEstimates.gasPrice),
              type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
              isAutomaticUpdate: true,
            },
          });
          break;
        case GAS_ESTIMATE_TYPES.NONE:
        default:
          break;
      }
      // Record the latest gasPriceEstimate for future comparisons
      state.gas.gasPriceEstimate = addHexPrefix(gasPriceEstimate);
    },
    /**
     * sets the layer 1 fees total (for a multi-layer fee network)
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action - the
     *  layer1GasTotal to set in hex wei.
     */
    updateLayer1Fees: (state, action) => {
      state.multiLayerFees.layer1GasTotal = action.payload;
      if (
        state.amount.mode === AMOUNT_MODES.MAX &&
        state.asset.type === ASSET_TYPES.NATIVE
      ) {
        slice.caseReducers.updateAmountToMax(state);
      }
    },
    /**
     * sets the amount mode to the provided value as long as it is one of the
     * supported modes (MAX|INPUT)
     *
     * @param {SendStateDraft} state - A writable draft of the send state to be
     *  updated.
     * @param {import(
     *  '@reduxjs/toolkit'
     * ).PayloadAction<SendStateAmountModeStrings>} action - The amount mode
     *  to set the state to.
     */
    updateAmountMode: (state, action) => {
      if (Object.values(AMOUNT_MODES).includes(action.payload)) {
        state.amount.mode = action.payload;
      }
    },
    updateAsset: (state, action) => {
      state.asset.type = action.payload.type;
      state.asset.balance = action.payload.balance;
      state.asset.error = action.payload.error;
      if (
        state.asset.type === ASSET_TYPES.TOKEN ||
        state.asset.type === ASSET_TYPES.COLLECTIBLE
      ) {
        state.asset.details = action.payload.details;
      } else {
        // clear the details object when sending native currency
        state.asset.details = null;
        if (state.recipient.error === CONTRACT_ADDRESS_ERROR) {
          // Errors related to sending tokens to their own contract address
          // are no longer valid when sending native currency.
          state.recipient.error = null;
        }

        if (state.recipient.warning === KNOWN_RECIPIENT_ADDRESS_WARNING) {
          // Warning related to sending tokens to a known contract address
          // are no longer valid when sending native currency.
          state.recipient.warning = null;
        }
      }
      // if amount mode is MAX update amount to max of new asset, otherwise set
      // to zero. This will revalidate the send amount field.
      if (state.amount.mode === AMOUNT_MODES.MAX) {
        slice.caseReducers.updateAmountToMax(state);
      } else {
        slice.caseReducers.updateSendAmount(state, { payload: '0x0' });
      }
      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    updateRecipient: (state, action) => {
      state.recipient.error = null;
      state.recipient.userInput = '';
      state.recipient.address = action.payload.address ?? '';
      state.recipient.nickname = action.payload.nickname ?? '';

      if (state.recipient.address === '') {
        // If address is null we are clearing the recipient and must return
        // to the ADD_RECIPIENT stage.
        state.stage = SEND_STAGES.ADD_RECIPIENT;
      } else {
        // if an address is provided and an id exists, we progress to the EDIT
        // stage, otherwise we progress to the DRAFT stage. We also reset the
        // search mode for recipient search.
        state.stage = state.id === null ? SEND_STAGES.DRAFT : SEND_STAGES.EDIT;
        state.recipient.mode = RECIPIENT_SEARCH_MODES.CONTACT_LIST;
      }

      // validate send state
      slice.caseReducers.validateSendState(state);
    },
    useDefaultGas: (state) => {
      // Show the default gas price/limit fields in the send page
      state.gas.isCustomGasSet = false;
    },
    useCustomGas: (state) => {
      // Show the gas fees set in the custom gas modal (state.gas.customData)
      state.gas.isCustomGasSet = true;
    },
    updateRecipientUserInput: (state, action) => {
      // Update the value in state to match what the user is typing into the
      // input field
      state.recipient.userInput = action.payload;
    },
    validateRecipientUserInput: (state, action) => {
      const { asset, recipient } = state;

      if (
        recipient.mode === RECIPIENT_SEARCH_MODES.MY_ACCOUNTS ||
        recipient.userInput === '' ||
        recipient.userInput === null
      ) {
        recipient.error = null;
        recipient.warning = null;
      } else {
        const isSendingToken =
          asset.type === ASSET_TYPES.TOKEN ||
          asset.type === ASSET_TYPES.COLLECTIBLE;
        const { chainId, tokens, tokenAddressList } = action.payload;
        if (
          isBurnAddress(recipient.userInput) ||
          (!isValidHexAddress(recipient.userInput, {
            mixedCaseUseChecksum: true,
          }) &&
            !isValidDomainName(recipient.userInput))
        ) {
          recipient.error = isDefaultMetaMaskChain(chainId)
            ? INVALID_RECIPIENT_ADDRESS_ERROR
            : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR;
        } else if (
          isSendingToken &&
          isOriginContractAddress(recipient.userInput, asset.details.address)
        ) {
          recipient.error = CONTRACT_ADDRESS_ERROR;
        } else {
          recipient.error = null;
        }
        if (
          isSendingToken &&
          isValidHexAddress(recipient.userInput) &&
          (tokenAddressList.find((address) =>
            isEqualCaseInsensitive(address, recipient.userInput),
          ) ||
            checkExistingAddresses(recipient.userInput, tokens))
        ) {
          recipient.warning = KNOWN_RECIPIENT_ADDRESS_WARNING;
        } else {
          recipient.warning = null;
        }
      }
    },
    updateRecipientSearchMode: (state, action) => {
      state.recipient.userInput = '';
      state.recipient.mode = action.payload;
    },
    resetSendState: () => initialState,
    validateAmountField: (state) => {
      switch (true) {
        // set error to INSUFFICIENT_FUNDS_ERROR if the account balance is lower
        // than the total price of the transaction inclusive of gas fees.
        case state.asset.type === ASSET_TYPES.NATIVE &&
          !isBalanceSufficient({
            amount: state.amount.value,
            balance: state.asset.balance,
            gasTotal: state.gas.gasTotal ?? '0x0',
          }):
          state.amount.error = INSUFFICIENT_FUNDS_ERROR;
          break;
        // set error to INSUFFICIENT_FUNDS_ERROR if the token balance is lower
        // than the amount of token the user is attempting to send.
        case state.asset.type === ASSET_TYPES.TOKEN &&
          !isTokenBalanceSufficient({
            tokenBalance: state.asset.balance ?? '0x0',
            amount: state.amount.value,
            decimals: state.asset.details.decimals,
          }):
          state.amount.error = INSUFFICIENT_TOKENS_ERROR;
          break;
        // if the amount is negative, set error to NEGATIVE_ETH_ERROR
        // TODO: change this to NEGATIVE_ERROR and remove the currency bias.
        case conversionGreaterThan(
          { value: 0, fromNumericBase: 'dec' },
          { value: state.amount.value, fromNumericBase: 'hex' },
        ):
          state.amount.error = NEGATIVE_ETH_ERROR;
          break;
        // If none of the above are true, set error to null
        default:
          state.amount.error = null;
      }
    },
    validateGasField: (state) => {
      // Checks if the user has enough funds to cover the cost of gas, always
      // uses the native currency and does not take into account the amount
      // being sent. If the user has enough to cover cost of gas but not gas
      // + amount then the error will be displayed on the amount field.
      const insufficientFunds = !isBalanceSufficient({
        amount:
          state.asset.type === ASSET_TYPES.NATIVE ? state.amount.value : '0x0',
        balance: state.account.balance,
        gasTotal: state.gas.gasTotal ?? '0x0',
      });

      state.gas.error = insufficientFunds ? INSUFFICIENT_FUNDS_ERROR : null;
    },
    validateSendState: (state) => {
      switch (true) {
        // 1 + 2. State is invalid when either gas or amount or asset fields have errors
        // 3. State is invalid if asset type is a token and the token details
        //  are unknown.
        // 4. State is invalid if no recipient has been added
        // 5. State is invalid if the send state is uninitialized
        // 6. State is invalid if gas estimates are loading
        // 7. State is invalid if gasLimit is less than the minimumGasLimit
        // 8. State is invalid if the selected asset is a ERC721
        case Boolean(state.amount.error):
        case Boolean(state.gas.error):
        case Boolean(state.asset.error):
        case state.asset.type === ASSET_TYPES.TOKEN &&
          state.asset.details === null:
        case state.stage === SEND_STAGES.ADD_RECIPIENT:
        case state.stage === SEND_STAGES.INACTIVE:
        case state.gas.isGasEstimateLoading:
        case new BigNumber(state.gas.gasLimit, 16).lessThan(
          new BigNumber(state.gas.minimumGasLimit),
        ):
          state.status = SEND_STATUSES.INVALID;
          break;
        default:
          state.status = SEND_STATUSES.VALID;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(QR_CODE_DETECTED, (state, action) => {
        // When data is received from the QR Code Scanner we set the recipient
        // as long as a valid address can be pulled from the data. If an
        // address is pulled but it is invalid, we display an error.
        const qrCodeData = action.value;
        if (qrCodeData) {
          if (qrCodeData.type === 'address') {
            const scannedAddress = qrCodeData.values.address.toLowerCase();
            if (
              isValidHexAddress(scannedAddress, { allowNonPrefixed: false })
            ) {
              if (state.recipient.address !== scannedAddress) {
                slice.caseReducers.updateRecipient(state, {
                  payload: { address: scannedAddress },
                });
              }
            } else {
              state.recipient.error = INVALID_RECIPIENT_ADDRESS_ERROR;
            }
          }
        }
      })
      .addCase(SELECTED_ACCOUNT_CHANGED, (state, action) => {
        // If we are on the edit flow the account we are keyed into will be the
        // original 'from' account, which may differ from the selected account
        if (state.stage !== SEND_STAGES.EDIT) {
          // This event occurs when the user selects a new account from the
          // account menu, or the currently active account's balance updates.
          state.account.balance = action.payload.account.balance;
          state.account.address = action.payload.account.address;
          // We need to update the asset balance if the asset is the native
          // network asset. Once we update the balance we recompute error state.
          if (state.asset.type === ASSET_TYPES.NATIVE) {
            state.asset.balance = action.payload.account.balance;
          }
          slice.caseReducers.validateAmountField(state);
          slice.caseReducers.validateGasField(state);
          slice.caseReducers.validateSendState(state);
        }
      })
      .addCase(ACCOUNT_CHANGED, (state, action) => {
        // If we are on the edit flow then we need to watch for changes to the
        // current account.address in state and keep balance updated
        // appropriately
        if (
          state.stage === SEND_STAGES.EDIT &&
          action.payload.account.address === state.account.address
        ) {
          // This event occurs when the user's account details update due to
          // background state changes. If the account that is being updated is
          // the current from account on the edit flow we need to update
          // the balance for the account and revalidate the send state.
          state.account.balance = action.payload.account.balance;
          // We need to update the asset balance if the asset is the native
          // network asset. Once we update the balance we recompute error state.
          if (state.asset.type === ASSET_TYPES.NATIVE) {
            state.asset.balance = action.payload.account.balance;
          }
          slice.caseReducers.validateAmountField(state);
          slice.caseReducers.validateGasField(state);
          slice.caseReducers.validateSendState(state);
        }
      })
      .addCase(ADDRESS_BOOK_UPDATED, (state, action) => {
        // When the address book updates from background state changes we need
        // to check to see if an entry exists for the current address or if the
        // entry changed.
        const { addressBook } = action.payload;
        if (addressBook[state.recipient.address]?.name) {
          state.recipient.nickname = addressBook[state.recipient.address].name;
        }
      })
      .addCase(initializeSendState.pending, (state) => {
        // when we begin initializing state, which can happen when switching
        // chains even after loading the send flow, we set
        // gas.isGasEstimateLoading as initialization will trigger a fetch
        // for gasPrice estimates.
        state.gas.isGasEstimateLoading = true;
      })
      .addCase(initializeSendState.fulfilled, (state, action) => {
        // writes the computed initialized state values into the slice and then
        // calculates slice validity using the caseReducers.
        state.eip1559support = action.payload.eip1559support;
        state.account.address = action.payload.address;
        state.account.balance = action.payload.nativeBalance;
        state.asset.balance = action.payload.assetBalance;
        state.gas.gasLimit = action.payload.gasLimit;
        slice.caseReducers.updateGasFeeEstimates(state, {
          payload: {
            gasFeeEstimates: action.payload.gasFeeEstimates,
            gasEstimateType: action.payload.gasEstimateType,
          },
        });
        state.gas.gasTotal = action.payload.gasTotal;
        state.gas.gasEstimatePollToken = action.payload.gasEstimatePollToken;
        if (action.payload.gasEstimatePollToken) {
          state.gas.isGasEstimateLoading = false;
        }
        if (state.stage !== SEND_STAGES.INACTIVE) {
          slice.caseReducers.validateRecipientUserInput(state, {
            payload: {
              chainId: action.payload.chainId,
              tokens: action.payload.tokens,
              useTokenDetection: action.payload.useTokenDetection,
              tokenAddressList: action.payload.tokenAddressList,
            },
          });
        }
        state.stage =
          state.stage === SEND_STAGES.INACTIVE
            ? SEND_STAGES.ADD_RECIPIENT
            : state.stage;
        slice.caseReducers.validateAmountField(state);
        slice.caseReducers.validateGasField(state);
        slice.caseReducers.validateSendState(state);
      })
      .addCase(computeEstimatedGasLimit.pending, (state) => {
        // When we begin to fetch gasLimit we should indicate we are loading
        // a gas estimate.
        state.gas.isGasEstimateLoading = true;
      })
      .addCase(computeEstimatedGasLimit.fulfilled, (state, action) => {
        // When we receive a new gasLimit from the computeEstimatedGasLimit
        // thunk we need to update our gasLimit in the slice. We call into the
        // caseReducer updateGasLimit to tap into the appropriate follow up
        // checks and gasTotal calculation. First set isGasEstimateLoading to
        // false.
        state.gas.isGasEstimateLoading = false;
        if (action.payload?.gasLimit) {
          slice.caseReducers.updateGasLimit(state, {
            payload: action.payload.gasLimit,
          });
        }
        if (action.payload?.layer1GasTotal) {
          slice.caseReducers.updateLayer1Fees(state, {
            payload: action.payload.layer1GasTotal,
          });
        }
      })
      .addCase(computeEstimatedGasLimit.rejected, (state) => {
        // If gas estimation fails, we should set the loading state to false,
        // because it is no longer loading
        state.gas.isGasEstimateLoading = false;
      })
      .addCase(GAS_FEE_ESTIMATES_UPDATED, (state, action) => {
        // When the gasFeeController updates its gas fee estimates we need to
        // update and validate state based on those new values
        slice.caseReducers.updateGasFeeEstimates(state, {
          payload: action.payload,
        });
      });
  },
});

const { actions, reducer } = slice;

export default reducer;

const {
  useDefaultGas,
  useCustomGas,
  updateGasLimit,
  validateRecipientUserInput,
  updateRecipientSearchMode,
  addHistoryEntry,
} = actions;

export { useDefaultGas, useCustomGas, updateGasLimit, addHistoryEntry };

// Action Creators

/**
 * This method is a temporary placeholder to support the old UI in both the
 * gas modal and the send flow. Soon we won't need to modify gasPrice from the
 * send flow based on user input, it'll just be a shallow copy of the current
 * estimate. This method is necessary because the internal structure of this
 * slice has been changed such that it is agnostic to transaction envelope
 * type, and this method calls into the new structure in the appropriate way.
 *
 * @deprecated - don't extend the usage of this temporary method
 * @param {string} gasPrice - new gas price in hex wei
 */
export function updateGasPrice(gasPrice) {
  return (dispatch) => {
    dispatch(
      addHistoryEntry(`sendFlow - user set legacy gasPrice to ${gasPrice}`),
    );
    dispatch(
      actions.updateGasFees({
        gasPrice,
        transactionType: TRANSACTION_ENVELOPE_TYPES.LEGACY,
      }),
    );
  };
}

export function resetSendState() {
  return async (dispatch, getState) => {
    const state = getState();
    dispatch(actions.resetSendState());

    if (state[name].gas.gasEstimatePollToken) {
      await disconnectGasFeeEstimatePoller(
        state[name].gas.gasEstimatePollToken,
      );
      removePollingTokenFromAppState(state[name].gas.gasEstimatePollToken);
    }
  };
}
/**
 * Updates the amount the user intends to send and performs side effects.
 * 1. If the current mode is MAX change to INPUT
 * 2. If sending a token, recompute the gasLimit estimate
 *
 * @param {string} amount - hex string representing value
 */
export function updateSendAmount(amount) {
  return async (dispatch, getState) => {
    const state = getState();
    const { metamask } = state;
    let logAmount = amount;
    if (state[name].asset.type === ASSET_TYPES.TOKEN) {
      const multiplier = Math.pow(
        10,
        Number(state[name].asset.details?.decimals || 0),
      );
      const decimalValueString = conversionUtil(addHexPrefix(amount), {
        fromNumericBase: 'hex',
        toNumericBase: 'dec',
        toCurrency: state[name].asset.details?.symbol,
        conversionRate: multiplier,
        invertConversionRate: true,
      });

      logAmount = `${Number(decimalValueString) ? decimalValueString : ''} ${
        state[name].asset.details?.symbol
      }`;
    } else {
      const ethValue = getValueFromWeiHex({
        value: amount,
        toCurrency: ETH,
        numberOfDecimals: 8,
      });
      logAmount = `${ethValue} ${metamask?.provider?.ticker || ETH}`;
    }
    await dispatch(
      addHistoryEntry(`sendFlow - user set amount to ${logAmount}`),
    );
    await dispatch(actions.updateSendAmount(amount));
    if (state.send.amount.mode === AMOUNT_MODES.MAX) {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.INPUT));
    }
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * Defines the shape for the details input parameter for updateSendAsset
 *
 * @typedef {Object} TokenDetails
 * @property {string} address - The contract address for the ERC20 token.
 * @property {string} decimals - The number of token decimals.
 * @property {string} symbol - The asset symbol to display.
 */

/**
 * updates the asset to send to one of NATIVE or TOKEN and ensures that the
 * asset balance is set. If sending a TOKEN also updates the asset details
 * object with the appropriate ERC20 details including address, symbol and
 * decimals.
 *
 * @param {Object} payload - action payload
 * @param {string} payload.type - type of asset to send
 * @param {TokenDetails} [payload.details] - ERC20 details if sending TOKEN asset
 */
export function updateSendAsset({ type, details }) {
  return async (dispatch, getState) => {
    dispatch(addHistoryEntry(`sendFlow - user set asset type to ${type}`));
    dispatch(
      addHistoryEntry(
        `sendFlow - user set asset symbol to ${details?.symbol ?? 'undefined'}`,
      ),
    );
    dispatch(
      addHistoryEntry(
        `sendFlow - user set asset address to ${
          details?.address ?? 'undefined'
        }`,
      ),
    );
    const state = getState();
    let { balance, error } = state.send.asset;
    const userAddress = state.send.account.address ?? getSelectedAddress(state);
    if (type === ASSET_TYPES.TOKEN) {
      if (details) {
        if (details.standard === undefined) {
          await dispatch(showLoadingIndication());
          const { standard } = await getTokenStandardAndDetails(
            details.address,
            userAddress,
          );
          if (
            process.env.COLLECTIBLES_V1 &&
            (standard === TOKEN_STANDARDS.ERC721 ||
              standard === TOKEN_STANDARDS.ERC1155)
          ) {
            await dispatch(hideLoadingIndication());
            dispatch(
              showModal({
                name: 'CONVERT_TOKEN_TO_NFT',
                tokenAddress: details.address,
              }),
            );
            error = INVALID_ASSET_TYPE;
            throw new Error(error);
          }
          details.standard = standard;
        }

        // if changing to a token, get the balance from the network. The asset
        // overview page and asset list on the wallet overview page contain
        // send buttons that call this method before initialization occurs.
        // When this happens we don't yet have an account.address so default to
        // the currently active account. In addition its possible for the balance
        // check to take a decent amount of time, so we display a loading
        // indication so that that immediate feedback is displayed to the user.
        if (details.standard === TOKEN_STANDARDS.ERC20) {
          error = null;
          balance = await getERC20Balance(details, userAddress);
        }
        await dispatch(hideLoadingIndication());
      }
    } else if (type === ASSET_TYPES.COLLECTIBLE) {
      let isCurrentOwner = true;
      try {
        isCurrentOwner = await isCollectibleOwner(
          getSelectedAddress(state),
          details.address,
          details.tokenId,
        );
      } catch (err) {
        if (err.message.includes('Unable to verify ownership.')) {
          // this would indicate that either our attempts to verify ownership failed because of network issues,
          // or, somehow a token has been added to collectibles state with an incorrect chainId.
        } else {
          // Any other error is unexpected and should be surfaced.
          dispatch(displayWarning(err.message));
        }
      }

      if (details.standard === undefined) {
        const { standard } = await getTokenStandardAndDetails(
          details.address,
          userAddress,
        );
        details.standard = standard;
      }

      if (details.standard === TOKEN_STANDARDS.ERC1155) {
        throw new Error('Sends of ERC1155 tokens are not currently supported');
      }

      if (isCurrentOwner) {
        error = null;
        balance = '0x1';
      } else {
        throw new Error(
          'Send slice initialized as collectible send with a collectible not currently owned by the select account',
        );
      }
    } else {
      error = null;
      // if changing to native currency, get it from the account key in send
      // state which is kept in sync when accounts change.
      balance = state.send.account.balance;
    }
    // update the asset in state which will re-run amount and gas validation
    await dispatch(actions.updateAsset({ type, details, balance, error }));
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * This method is for usage when validating user input so that validation
 * is only run after a delay in typing of 300ms. Usage at callsites requires
 * passing in both the dispatch method and the payload to dispatch, which makes
 * it only applicable for use within action creators.
 */
const debouncedValidateRecipientUserInput = debounce((dispatch, payload) => {
  dispatch(
    addHistoryEntry(
      `sendFlow - user typed ${payload.userInput} into recipient input field`,
    ),
  );
  dispatch(validateRecipientUserInput(payload));
}, 300);

/**
 * This method is called to update the user's input into the ENS input field.
 * Once the field is updated, the field will be validated using a debounced
 * version of the validateRecipientUserInput action. This way validation only
 * occurs once the user has stopped typing.
 *
 * @param {string} userInput - the value that the user is typing into the field
 */
export function updateRecipientUserInput(userInput) {
  return async (dispatch, getState) => {
    await dispatch(actions.updateRecipientUserInput(userInput));
    const state = getState();
    const chainId = getCurrentChainId(state);
    const tokens = getTokens(state);
    const useTokenDetection = getUseTokenDetection(state);
    const tokenAddressList = Object.keys(getTokenList(state));
    debouncedValidateRecipientUserInput(dispatch, {
      userInput,
      chainId,
      tokens,
      useTokenDetection,
      tokenAddressList,
    });
  };
}

export function useContactListForRecipientSearch() {
  return (dispatch) => {
    dispatch(
      addHistoryEntry(
        `sendFlow - user selected back to all on recipient screen`,
      ),
    );
    dispatch(updateRecipientSearchMode(RECIPIENT_SEARCH_MODES.CONTACT_LIST));
  };
}

export function useMyAccountsForRecipientSearch() {
  return (dispatch) => {
    dispatch(
      addHistoryEntry(
        `sendFlow - user selected transfer to my accounts on recipient screen`,
      ),
    );
    dispatch(updateRecipientSearchMode(RECIPIENT_SEARCH_MODES.MY_ACCOUNTS));
  };
}

/**
 * Updates the recipient in state based on the input provided, and then will
 * recompute gas limit when sending a TOKEN asset type. Changing the recipient
 * address results in hex data changing because the recipient address is
 * encoded in the data instead of being in the 'to' field. The to field in a
 * token send will always be the token contract address.
 * If no nickname is provided, the address book state will be checked to see if
 * a nickname for the passed address has already been saved. This ensures the
 * (temporary) send state recipient nickname is consistent with the address book
 * nickname which has already been persisted to state.
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.address - hex address to send the transaction to
 * @param {string} [recipient.nickname] - Alias for the address to display
 *  to the user
 */
export function updateRecipient({ address, nickname }) {
  return async (dispatch, getState) => {
    // Do not addHistoryEntry here as this is called from a number of places
    // each with significance to the user and transaction history.
    const state = getState();
    const nicknameFromAddressBookEntryOrAccountName =
      getAddressBookEntryOrAccountName(state, address) ?? '';
    await dispatch(
      actions.updateRecipient({
        address,
        nickname: nickname || nicknameFromAddressBookEntryOrAccountName,
      }),
    );
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * Clears out the recipient user input, ENS resolution and recipient validation.
 */
export function resetRecipientInput() {
  return async (dispatch) => {
    await dispatch(addHistoryEntry(`sendFlow - user cleared recipient input`));
    await dispatch(updateRecipientUserInput(''));
    await dispatch(updateRecipient({ address: '', nickname: '' }));
    await dispatch(resetEnsResolution());
    await dispatch(validateRecipientUserInput());
  };
}

/**
 * When a user has enabled hex data field in advanced settings they will be
 * able to supply hex data on a transaction. This method updates the user
 * supplied data. Note, when sending native assets this will result in
 * recomputing estimated gasLimit. When sending a ERC20 asset this is not done
 * because the data sent in the transaction will be determined by the asset,
 * recipient and value, NOT what the user has supplied.
 *
 * @param {string} hexData - hex encoded string representing transaction data.
 */
export function updateSendHexData(hexData) {
  return async (dispatch, getState) => {
    await dispatch(
      addHistoryEntry(`sendFlow - user added custom hexData ${hexData}`),
    );
    await dispatch(actions.updateUserInputHexData(hexData));
    const state = getState();
    if (state.send.asset.type === ASSET_TYPES.NATIVE) {
      await dispatch(computeEstimatedGasLimit());
    }
  };
}

/**
 * Toggles the amount.mode between INPUT and MAX modes.
 * As a result, the amount.value will change to either '0x0' when moving from
 * MAX to INPUT, or to the maximum allowable amount based on current asset when
 * moving from INPUT to MAX.
 */
export function toggleSendMaxMode() {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.send.amount.mode === AMOUNT_MODES.MAX) {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.INPUT));
      await dispatch(actions.updateSendAmount('0x0'));
      await dispatch(addHistoryEntry(`sendFlow - user toggled max mode off`));
    } else {
      await dispatch(actions.updateAmountMode(AMOUNT_MODES.MAX));
      await dispatch(actions.updateAmountToMax());
      await dispatch(addHistoryEntry(`sendFlow - user toggled max mode on`));
    }
    await dispatch(computeEstimatedGasLimit());
  };
}

/**
 * Signs a transaction or updates a transaction in state if editing.
 * This method is called when a user clicks the next button in the footer of
 * the send page, signaling that a transaction should be executed. This method
 * will create the transaction in state (by way of the various global provider
 * constructs) which will eventually (and fairly quickly from user perspective)
 * result in a confirmation window being displayed for the transaction.
 */
export function signTransaction() {
  return async (dispatch, getState) => {
    const state = getState();
    const { id, asset, stage, eip1559support } = state[name];
    const txParams = generateTransactionParams(state[name]);
    if (stage === SEND_STAGES.EDIT) {
      // When dealing with the edit flow there is already a transaction in
      // state that we must update, this branch is responsible for that logic.
      // We first must grab the previous transaction object from state and then
      // merge in the modified txParams. Once the transaction has been modified
      // we can send that to the background to update the transaction in state.
      const unapprovedTxs = getUnapprovedTxs(state);
      const unapprovedTx = unapprovedTxs[id];
      // We only update the tx params that can be changed via the edit flow UX
      const eip1559OnlyTxParamsToUpdate = {
        data: txParams.data,
        from: txParams.from,
        to: txParams.to,
        value: txParams.value,
        gas: unapprovedTx.userEditedGasLimit
          ? unapprovedTx.txParams.gas
          : txParams.gas,
      };
      unapprovedTx.originalGasEstimate = eip1559OnlyTxParamsToUpdate.gas;
      const editingTx = {
        ...unapprovedTx,
        txParams: Object.assign(
          unapprovedTx.txParams,
          eip1559support ? eip1559OnlyTxParamsToUpdate : txParams,
        ),
      };

      await dispatch(
        addHistoryEntry(
          `sendFlow - user clicked next and transaction should be updated in controller`,
        ),
      );
      await dispatch(updateTransactionSendFlowHistory(id, state[name].history));
      dispatch(updateEditableParams(id, editingTx.txParams));
      dispatch(updateTransactionGasFees(id, editingTx.txParams));
    } else {
      let transactionType = TRANSACTION_TYPES.SIMPLE_SEND;

      if (asset.type !== ASSET_TYPES.NATIVE) {
        transactionType =
          asset.type === ASSET_TYPES.COLLECTIBLE
            ? TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM
            : TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER;
      }
      await dispatch(
        addHistoryEntry(
          `sendFlow - user clicked next and transaction should be added to controller`,
        ),
      );

      dispatch(
        addUnapprovedTransactionAndRouteToConfirmationPage(
          txParams,
          transactionType,
          state[name].history,
        ),
      );
    }
  };
}

export function editTransaction(
  assetType,
  transactionId,
  tokenData,
  assetDetails,
) {
  return async (dispatch, getState) => {
    const state = getState();
    await dispatch(
      addHistoryEntry(
        `sendFlow - user clicked edit on transaction with id ${transactionId}`,
      ),
    );
    const unapprovedTransactions = getUnapprovedTxs(state);
    const transaction = unapprovedTransactions[transactionId];
    const { txParams } = transaction;
    if (assetType === ASSET_TYPES.NATIVE) {
      const {
        data,
        from,
        gas: gasLimit,
        gasPrice,
        to: address,
        value: amount,
      } = txParams;
      const nickname = getAddressBookEntry(state, address)?.name ?? '';
      await dispatch(
        actions.editTransaction({
          data,
          id: transactionId,
          gasLimit,
          gasPrice,
          from,
          amount,
          address,
          nickname,
        }),
      );
    } else if (!tokenData || !assetDetails) {
      throw new Error(
        `send/editTransaction dispatched with assetType 'TOKEN' but missing assetData or assetDetails parameter`,
      );
    } else if (assetType === ASSET_TYPES.TOKEN) {
      const {
        data,
        from,
        to: tokenAddress,
        gas: gasLimit,
        gasPrice,
      } = txParams;
      const tokenAmountInDec = getTokenValueParam(tokenData);
      const address = getTokenAddressParam(tokenData);
      const nickname = getAddressBookEntry(state, address)?.name ?? '';

      const tokenAmountInHex = addHexPrefix(
        conversionUtil(tokenAmountInDec, {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
        }),
      );

      await dispatch(
        updateSendAsset({
          type: ASSET_TYPES.TOKEN,
          details: { ...assetDetails, address: tokenAddress },
        }),
      );

      await dispatch(
        actions.editTransaction({
          data,
          id: transactionId,
          gasLimit,
          gasPrice,
          from,
          amount: tokenAmountInHex,
          address,
          nickname,
        }),
      );
    } else if (assetType === ASSET_TYPES.COLLECTIBLE) {
      const {
        data,
        from,
        to: tokenAddress,
        gas: gasLimit,
        gasPrice,
      } = txParams;
      const address = getTokenAddressParam(tokenData);
      const nickname = getAddressBookEntry(state, address)?.name ?? '';

      await dispatch(
        updateSendAsset({
          type: ASSET_TYPES.COLLECTIBLE,
          details: { ...assetDetails, address: tokenAddress },
        }),
      );

      await dispatch(
        actions.editTransaction({
          data,
          id: transactionId,
          gasLimit,
          gasPrice,
          from,
          amount: '0x1',
          address,
          nickname,
        }),
      );
    }
  };
}

// Selectors

// Gas selectors
export function getGasLimit(state) {
  return state[name].gas.gasLimit;
}

export function getGasPrice(state) {
  return state[name].gas.gasPrice;
}

export function getGasTotal(state) {
  return state[name].gas.gasTotal;
}

export function gasFeeIsInError(state) {
  return Boolean(state[name].gas.error);
}

export function getMinimumGasLimitForSend(state) {
  return state[name].gas.minimumGasLimit;
}

export function getGasInputMode(state) {
  const isMainnet = getIsMainnet(state);
  const gasEstimateType = getGasEstimateType(state);
  const showAdvancedGasFields = getAdvancedInlineGasShown(state);
  if (state[name].gas.isCustomGasSet) {
    return GAS_INPUT_MODES.CUSTOM;
  }
  if ((!isMainnet && !process.env.IN_TEST) || showAdvancedGasFields) {
    return GAS_INPUT_MODES.INLINE;
  }

  // We get eth_gasPrice estimation if the legacy API fails but we need to
  // instruct the UI to render the INLINE inputs in this case, only on
  // mainnet or IN_TEST.
  if (
    (isMainnet || process.env.IN_TEST) &&
    gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE
  ) {
    return GAS_INPUT_MODES.INLINE;
  }
  return GAS_INPUT_MODES.BASIC;
}

// Asset Selectors
export function getSendAsset(state) {
  return state[name].asset;
}

export function getSendAssetAddress(state) {
  return getSendAsset(state)?.details?.address;
}

export function getIsAssetSendable(state) {
  if (state[name].asset.type === ASSET_TYPES.NATIVE) {
    return true;
  }
  return state[name].asset.details.isERC721 === false;
}

export function getAssetError(state) {
  return state[name].asset.error;
}

// Amount Selectors
export function getSendAmount(state) {
  return state[name].amount.value;
}

export function getIsBalanceInsufficient(state) {
  return state[name].gas.error === INSUFFICIENT_FUNDS_ERROR;
}
export function getSendMaxModeState(state) {
  return state[name].amount.mode === AMOUNT_MODES.MAX;
}

export function getSendHexData(state) {
  return state[name].userInputHexData;
}

export function getDraftTransactionID(state) {
  return state[name].id;
}

export function sendAmountIsInError(state) {
  return Boolean(state[name].amount.error);
}

// Recipient Selectors

export function getSendTo(state) {
  return state[name].recipient.address;
}

export function getIsUsingMyAccountForRecipientSearch(state) {
  return state[name].recipient.mode === RECIPIENT_SEARCH_MODES.MY_ACCOUNTS;
}

export function getRecipientUserInput(state) {
  return state[name].recipient.userInput;
}

export function getRecipient(state) {
  return state[name].recipient;
}

// Overall validity and stage selectors

export function getSendErrors(state) {
  return {
    gasFee: state.send.gas.error,
    amount: state.send.amount.error,
  };
}

export function isSendStateInitialized(state) {
  return state[name].stage !== SEND_STAGES.INACTIVE;
}

export function isSendFormInvalid(state) {
  return state[name].status === SEND_STATUSES.INVALID;
}

export function getSendStage(state) {
  return state[name].stage;
}
