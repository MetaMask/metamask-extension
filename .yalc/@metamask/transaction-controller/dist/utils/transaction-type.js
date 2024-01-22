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
exports.determineTransactionType = exports.ESTIMATE_GAS_ERROR = void 0;
const abi_1 = require("@ethersproject/abi");
const controller_utils_1 = require("@metamask/controller-utils");
const metamask_eth_abis_1 = require("@metamask/metamask-eth-abis");
const types_1 = require("../types");
exports.ESTIMATE_GAS_ERROR = 'eth_estimateGas rpc method error';
const ERC20Interface = new abi_1.Interface(metamask_eth_abis_1.abiERC20);
const ERC721Interface = new abi_1.Interface(metamask_eth_abis_1.abiERC721);
const ERC1155Interface = new abi_1.Interface(metamask_eth_abis_1.abiERC1155);
/**
 * Determines the type of the transaction by analyzing the txParams.
 * It will never return TRANSACTION_TYPE_CANCEL or TRANSACTION_TYPE_RETRY as these
 * represent specific events that we specify manually at transaction creation.
 *
 * @param txParams - Parameters for the transaction.
 * @param ethQuery - EthQuery instance.
 * @returns A object with the transaction type and the contract code response in Hex.
 */
function determineTransactionType(txParams, ethQuery) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { data, to } = txParams;
        if (data && !to) {
            return { type: types_1.TransactionType.deployContract, getCodeResponse: undefined };
        }
        const { contractCode: getCodeResponse, isContractAddress } = yield readAddressAsContract(ethQuery, to);
        if (!isContractAddress) {
            return { type: types_1.TransactionType.simpleSend, getCodeResponse };
        }
        const hasValue = Number((_a = txParams.value) !== null && _a !== void 0 ? _a : '0') !== 0;
        const contractInteractionResult = {
            type: types_1.TransactionType.contractInteraction,
            getCodeResponse,
        };
        if (!data || hasValue) {
            return contractInteractionResult;
        }
        const name = (_b = parseStandardTokenTransactionData(data)) === null || _b === void 0 ? void 0 : _b.name;
        if (!name) {
            return contractInteractionResult;
        }
        const tokenMethodName = [
            types_1.TransactionType.tokenMethodApprove,
            types_1.TransactionType.tokenMethodSetApprovalForAll,
            types_1.TransactionType.tokenMethodTransfer,
            types_1.TransactionType.tokenMethodTransferFrom,
            types_1.TransactionType.tokenMethodSafeTransferFrom,
        ].find((methodName) => methodName.toLowerCase() === name.toLowerCase());
        if (tokenMethodName) {
            return { type: tokenMethodName, getCodeResponse };
        }
        return contractInteractionResult;
    });
}
exports.determineTransactionType = determineTransactionType;
/**
 * Attempts to decode transaction data using ABIs for three different token standards: ERC20, ERC721, ERC1155.
 * The data will decode correctly if the transaction is an interaction with a contract that matches one of these
 * contract standards
 *
 * @param data - Encoded transaction data.
 * @returns A representation of an ethereum contract call.
 */
function parseStandardTokenTransactionData(data) {
    if (!data) {
        return undefined;
    }
    try {
        return ERC20Interface.parseTransaction({ data });
    }
    catch (_a) {
        // ignore and next try to parse with erc721 ABI
    }
    try {
        return ERC721Interface.parseTransaction({ data });
    }
    catch (_b) {
        // ignore and next try to parse with erc1155 ABI
    }
    try {
        return ERC1155Interface.parseTransaction({ data });
    }
    catch (_c) {
        // ignore and return undefined
    }
    return undefined;
}
/**
 * Reads an Ethereum address and determines if it is a contract address.
 *
 * @param ethQuery - The Ethereum query object used to interact with the Ethereum blockchain.
 * @param address - The Ethereum address.
 * @returns An object containing the contract code and a boolean indicating if it is a contract address.
 */
function readAddressAsContract(ethQuery, address) {
    return __awaiter(this, void 0, void 0, function* () {
        let contractCode;
        try {
            contractCode = yield (0, controller_utils_1.query)(ethQuery, 'getCode', [address]);
        }
        catch (e) {
            contractCode = null;
        }
        const isContractAddress = contractCode
            ? contractCode !== '0x' && contractCode !== '0x0'
            : false;
        return { contractCode, isContractAddress };
    });
}
//# sourceMappingURL=transaction-type.js.map