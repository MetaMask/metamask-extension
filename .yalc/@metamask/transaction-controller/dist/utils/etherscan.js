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
exports.fetchEtherscanTokenTransactions = exports.fetchEtherscanTransactions = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
/**
 * Retrieves transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch transactions.
 * @param request.address - Address to retrieve transactions for.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching transactions from.
 * @param request.limit - Number of transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
function fetchEtherscanTransactions({ address, chainId, fromBlock, limit, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchTransactions('txlist', {
            address,
            chainId,
            fromBlock,
            limit,
        });
    });
}
exports.fetchEtherscanTransactions = fetchEtherscanTransactions;
/**
 * Retrieves token transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch token transactions.
 * @param request.address - Address to retrieve token transactions for.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching token transactions from.
 * @param request.limit - Number of token transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
function fetchEtherscanTokenTransactions({ address, chainId, fromBlock, limit, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchTransactions('tokentx', {
            address,
            chainId,
            fromBlock,
            limit,
        });
    });
}
exports.fetchEtherscanTokenTransactions = fetchEtherscanTokenTransactions;
/**
 * Retrieves transaction data from Etherscan from a specific endpoint.
 *
 * @param action - The Etherscan endpoint to use.
 * @param options - Options bag.
 * @param options.address - Address to retrieve transactions for.
 * @param options.chainId - Current chain ID used to determine subdomain and domain.
 * @param options.fromBlock - Block number to start fetching transactions from.
 * @param options.limit - Number of transactions to retrieve.
 * @returns An object containing the request status and an array of transaction data.
 */
function fetchTransactions(action, { address, chainId, fromBlock, limit, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlParams = {
            module: 'account',
            address,
            startBlock: fromBlock === null || fromBlock === void 0 ? void 0 : fromBlock.toString(),
            offset: limit === null || limit === void 0 ? void 0 : limit.toString(),
            sort: 'desc',
        };
        const etherscanTxUrl = getEtherscanApiUrl(chainId, Object.assign(Object.assign({}, urlParams), { action }));
        (0, logger_1.incomingTransactionsLogger)('Sending Etherscan request', etherscanTxUrl);
        const response = (yield (0, controller_utils_1.handleFetch)(etherscanTxUrl));
        return response;
    });
}
/**
 * Return a URL that can be used to fetch data from Etherscan.
 *
 * @param chainId - Current chain ID used to determine subdomain and domain.
 * @param urlParams - The parameters used to construct the URL.
 * @returns URL to access Etherscan data.
 */
function getEtherscanApiUrl(chainId, urlParams) {
    const networkInfo = constants_1.ETHERSCAN_SUPPORTED_NETWORKS[chainId];
    if (!networkInfo) {
        throw new Error(`Etherscan does not support chain with ID: ${chainId}`);
    }
    const apiUrl = `https://${networkInfo.subdomain}.${networkInfo.domain}`;
    let url = `${apiUrl}/api?`;
    for (const paramKey of Object.keys(urlParams)) {
        const value = urlParams[paramKey];
        if (!value) {
            continue;
        }
        url += `${paramKey}=${value}&`;
    }
    url += 'tag=latest&page=1';
    return url;
}
//# sourceMappingURL=etherscan.js.map