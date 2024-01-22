"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostTransactionBalance = exports.updateSwapsTransaction = exports.SWAP_TRANSACTION_TYPES = exports.SWAPS_CHAINID_DEFAULT_TOKEN_MAP = exports.DEFAULT_TOKEN_ADDRESS = exports.UPDATE_POST_TX_BALANCE_ATTEMPTS = exports.UPDATE_POST_TX_BALANCE_TIMEOUT = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const types_1 = require("../types");
const utils_1 = require("./utils");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'swaps');
/**
 * Interval in milliseconds between checks of post transaction balance
 */
exports.UPDATE_POST_TX_BALANCE_TIMEOUT = 5000;
/**
 * Retry attempts for checking post transaction balance
 */
exports.UPDATE_POST_TX_BALANCE_ATTEMPTS = 6;
const SWAPS_TESTNET_CHAIN_ID = '0x539';
/**
 * An address that the metaswap-api recognizes as the default token for the current network, in place of the token address that ERC-20 tokens have
 */
exports.DEFAULT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const ETH_SWAPS_TOKEN_OBJECT = {
    name: 'Ether',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const BNB_SWAPS_TOKEN_OBJECT = {
    name: 'Binance Coin',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const MATIC_SWAPS_TOKEN_OBJECT = {
    name: 'Matic',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const AVAX_SWAPS_TOKEN_OBJECT = {
    name: 'Avalanche',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const TEST_ETH_SWAPS_TOKEN_OBJECT = {
    name: 'Test Ether',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const GOERLI_SWAPS_TOKEN_OBJECT = {
    name: 'Ether',
    address: exports.DEFAULT_TOKEN_ADDRESS,
    decimals: 18,
};
const ARBITRUM_SWAPS_TOKEN_OBJECT = Object.assign({}, ETH_SWAPS_TOKEN_OBJECT);
const OPTIMISM_SWAPS_TOKEN_OBJECT = Object.assign({}, ETH_SWAPS_TOKEN_OBJECT);
const ZKSYNC_ERA_SWAPS_TOKEN_OBJECT = Object.assign({}, ETH_SWAPS_TOKEN_OBJECT);
exports.SWAPS_CHAINID_DEFAULT_TOKEN_MAP = {
    [constants_1.CHAIN_IDS.MAINNET]: ETH_SWAPS_TOKEN_OBJECT,
    [SWAPS_TESTNET_CHAIN_ID]: TEST_ETH_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.BSC]: BNB_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.POLYGON]: MATIC_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.GOERLI]: GOERLI_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.AVALANCHE]: AVAX_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.OPTIMISM]: OPTIMISM_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.ARBITRUM]: ARBITRUM_SWAPS_TOKEN_OBJECT,
    [constants_1.CHAIN_IDS.ZKSYNC_ERA]: ZKSYNC_ERA_SWAPS_TOKEN_OBJECT,
};
exports.SWAP_TRANSACTION_TYPES = [
    types_1.TransactionType.swap,
    types_1.TransactionType.swapApproval,
];
/**
 * Updates the transaction meta object with the swap information
 *
 * @param transactionMeta - The transaction meta object to update
 * @param transactionType - The type of the transaction
 * @param swaps - The swaps object
 * @param swaps.hasApproveTx - Whether the swap has an approval transaction
 * @param swaps.meta - The swap meta object
 * @param updateSwapsTransactionRequest - Dependency bag
 * @param updateSwapsTransactionRequest.isSwapsDisabled - Whether swaps are disabled
 * @param updateSwapsTransactionRequest.cancelTransaction - Function to cancel a transaction
 * @param updateSwapsTransactionRequest.controllerHubEmitter - Function to emit an event to the controller hub
 */
function updateSwapsTransaction(transactionMeta, transactionType, swaps, { isSwapsDisabled, cancelTransaction, controllerHubEmitter, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isSwapsDisabled || !exports.SWAP_TRANSACTION_TYPES.includes(transactionType)) {
            return;
        }
        // The simulationFails property is added if the estimateGas call fails. In cases
        // when no swaps approval tx is required, this indicates that the swap will likely
        // fail. There was an earlier estimateGas call made by the swaps controller,
        // but it is possible that external conditions have change since then, and
        // a previously succeeding estimate gas call could now fail. By checking for
        // the `simulationFails` property here, we can reduce the number of swap
        // transactions that get published to the blockchain only to fail and thereby
        // waste the user's funds on gas.
        if (transactionType === types_1.TransactionType.swap &&
            (swaps === null || swaps === void 0 ? void 0 : swaps.hasApproveTx) === false &&
            transactionMeta.simulationFails) {
            yield cancelTransaction(transactionMeta.id);
            throw new Error('Simulation failed');
        }
        const swapsMeta = swaps === null || swaps === void 0 ? void 0 : swaps.meta;
        if (!swapsMeta) {
            return;
        }
        if (transactionType === types_1.TransactionType.swapApproval) {
            updateSwapApprovalTransaction(transactionMeta, swapsMeta);
            controllerHubEmitter('transaction-new-swap-approval', {
                transactionMeta,
            });
        }
        if (transactionType === types_1.TransactionType.swap) {
            updateSwapTransaction(transactionMeta, swapsMeta);
            controllerHubEmitter('transaction-new-swap', {
                transactionMeta,
            });
        }
    });
}
exports.updateSwapsTransaction = updateSwapsTransaction;
/**
 * Attempts to update the post transaction balance of the provided transaction
 *
 * @param transactionMeta - Transaction meta object to update
 * @param updatePostTransactionBalanceRequest - Dependency bag
 * @param updatePostTransactionBalanceRequest.ethQuery - EthQuery object
 * @param updatePostTransactionBalanceRequest.getTransaction - Reading function for the latest transaction state
 * @param updatePostTransactionBalanceRequest.updateTransaction - Updating transaction function
 */
function updatePostTransactionBalance(transactionMeta, { ethQuery, getTransaction, updateTransaction, }) {
    return __awaiter(this, void 0, void 0, function* () {
        log('Updating post transaction balance', transactionMeta.id);
        const transactionId = transactionMeta.id;
        let latestTransactionMeta, approvalTransactionMeta;
        for (let i = 0; i < exports.UPDATE_POST_TX_BALANCE_ATTEMPTS; i++) {
            log('Querying balance', { attempt: i });
            const postTransactionBalance = yield (0, controller_utils_1.query)(ethQuery, 'getBalance', [
                transactionMeta.txParams.from,
            ]);
            latestTransactionMeta = getTransaction(transactionId);
            approvalTransactionMeta = latestTransactionMeta.approvalTxId
                ? getTransaction(latestTransactionMeta.approvalTxId)
                : undefined;
            latestTransactionMeta.postTxBalance = postTransactionBalance.toString(16);
            const isDefaultTokenAddress = isSwapsDefaultTokenAddress(transactionMeta.destinationTokenAddress, transactionMeta.chainId);
            if (!isDefaultTokenAddress ||
                transactionMeta.preTxBalance !== latestTransactionMeta.postTxBalance) {
                log('Finishing post balance update', {
                    isDefaultTokenAddress,
                    preTxBalance: transactionMeta.preTxBalance,
                    postTxBalance: latestTransactionMeta.postTxBalance,
                });
                break;
            }
            log('Waiting for balance to update', {
                delay: exports.UPDATE_POST_TX_BALANCE_TIMEOUT,
            });
            yield sleep(exports.UPDATE_POST_TX_BALANCE_TIMEOUT);
        }
        updateTransaction(latestTransactionMeta, 'TransactionController#updatePostTransactionBalance - Add post transaction balance');
        log('Completed post balance update', latestTransactionMeta === null || latestTransactionMeta === void 0 ? void 0 : latestTransactionMeta.postTxBalance);
        return {
            updatedTransactionMeta: latestTransactionMeta,
            approvalTransactionMeta,
        };
    });
}
exports.updatePostTransactionBalance = updatePostTransactionBalance;
/**
 * Updates the transaction meta object with the swap information
 *
 * @param transactionMeta - Transaction meta object to update
 * @param propsToUpdate - Properties to update
 * @param propsToUpdate.sourceTokenSymbol - Symbol of the token to be swapped
 * @param propsToUpdate.destinationTokenSymbol - Symbol of the token to be received
 * @param propsToUpdate.type - Type of the transaction
 * @param propsToUpdate.destinationTokenDecimals - Decimals of the token to be received
 * @param propsToUpdate.destinationTokenAddress - Address of the token to be received
 * @param propsToUpdate.swapMetaData - Metadata of the swap
 * @param propsToUpdate.swapTokenValue - Value of the token to be swapped
 * @param propsToUpdate.estimatedBaseFee - Estimated base fee of the transaction
 * @param propsToUpdate.approvalTxId - Transaction id of the approval transaction
 */
function updateSwapTransaction(transactionMeta, { sourceTokenSymbol, destinationTokenSymbol, type, destinationTokenDecimals, destinationTokenAddress, swapMetaData, swapTokenValue, estimatedBaseFee, approvalTxId, }) {
    (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updateSwapTransaction');
    let swapTransaction = {
        sourceTokenSymbol,
        destinationTokenSymbol,
        type,
        destinationTokenDecimals,
        destinationTokenAddress,
        swapMetaData,
        swapTokenValue,
        estimatedBaseFee,
        approvalTxId,
    };
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    swapTransaction = (0, lodash_1.pickBy)(swapTransaction);
    (0, lodash_1.merge)(transactionMeta, swapTransaction);
}
/**
 * Updates the transaction meta object with the swap approval information
 *
 * @param transactionMeta - Transaction meta object to update
 * @param propsToUpdate - Properties to update
 * @param propsToUpdate.type - Type of the transaction
 * @param propsToUpdate.sourceTokenSymbol - Symbol of the token to be swapped
 */
function updateSwapApprovalTransaction(transactionMeta, { type, sourceTokenSymbol }) {
    (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updateSwapApprovalTransaction');
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let swapApprovalTransaction = { type, sourceTokenSymbol };
    swapApprovalTransaction = (0, lodash_1.pickBy)({
        type,
        sourceTokenSymbol,
    });
    (0, lodash_1.merge)(transactionMeta, swapApprovalTransaction);
}
/**
 * Checks whether the provided address is strictly equal to the address for
 * the default swaps token of the provided chain.
 *
 * @param address - The string to compare to the default token address
 * @param chainId - The hex encoded chain ID of the default swaps token to check
 * @returns Whether the address is the provided chain's default token address
 */
function isSwapsDefaultTokenAddress(address, chainId) {
    var _a;
    if (!address || !chainId) {
        return false;
    }
    return (address ===
        ((_a = exports.SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]) === null || _a === void 0 ? void 0 : _a.address));
}
/**
 * Sleeps for the provided number of milliseconds
 *
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the provided number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=swaps.js.map