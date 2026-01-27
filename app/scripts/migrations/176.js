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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = void 0;
exports.migrate = migrate;
var utils_1 = require("@metamask/utils");
var lodash_1 = require("lodash");
exports.version = 176;
var SOLANA_MAINNET_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
/**
 * Validate that the given entry is a valid transaction state entry.
 *
 * @param entry - The entry to validate.
 * @returns True if the entry is valid, false otherwise.
 */
function isValidTransactionStateEntry(entry) {
    return (typeof entry === 'object' &&
        entry !== null &&
        (0, utils_1.hasProperty)(entry, 'transactions') &&
        (0, utils_1.hasProperty)(entry, 'next') &&
        (0, utils_1.hasProperty)(entry, 'lastUpdated') &&
        Array.isArray(entry.transactions) &&
        (typeof entry.next === 'string' || entry.next === null) &&
        typeof entry.lastUpdated === 'number');
}
/**
 * Check if the account data is already in the new nested format.
 * The new format has chainId keys (e.g., 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')
 * containing TransactionStateEntry objects.
 *
 * @param entry - The entry to check.
 * @returns True if already in the new format, false otherwise.
 */
function isAlreadyMigrated(entry) {
    if (typeof entry !== 'object' || entry === null) {
        return false;
    }
    // Check if this looks like the new format by examining its properties
    // In the new format, the keys should be chainId strings (containing ':')
    // and values should be TransactionStateEntry objects
    var keys = Object.keys(entry);
    // If it has no keys, it's empty and can be considered already migrated
    if (keys.length === 0) {
        return true;
    }
    // Check if at least one key looks like a chainId (contains ':')
    // and its value is a valid TransactionStateEntry
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (key.includes(':') && (0, utils_1.hasProperty)(entry, key)) {
            var value = entry[key];
            if (isValidTransactionStateEntry(value)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * This migration transforms the MultichainTransactionsController state structure
 * to support per-chain transaction storage. It moves transactions from directly
 * under the account to be nested under the chainId (Solana in this case).
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
function migrate(originalVersionedData) {
    return __awaiter(this, void 0, void 0, function () {
        var versionedData;
        return __generator(this, function (_a) {
            versionedData = (0, lodash_1.cloneDeep)(originalVersionedData);
            versionedData.meta.version = exports.version;
            transformState(versionedData.data);
            return [2 /*return*/, versionedData];
        });
    });
}
function transformState(state) {
    var _a;
    var _b, _c;
    if (!(0, utils_1.hasProperty)(state, 'MultichainTransactionsController') ||
        !(0, utils_1.isObject)(state.MultichainTransactionsController)) {
        console.warn('Skipping migration. MultichainTransactionsController state not found.');
        return state;
    }
    var transactionsController = state.MultichainTransactionsController;
    if (!(0, utils_1.hasProperty)(transactionsController, 'nonEvmTransactions') ||
        !(0, utils_1.isObject)(transactionsController.nonEvmTransactions)) {
        (_c = (_b = global.sentry) === null || _b === void 0 ? void 0 : _b.captureException) === null || _c === void 0 ? void 0 : _c.call(_b, new Error("Invalid nonEvmTransactions state: ".concat(typeof transactionsController.nonEvmTransactions)));
        return state;
    }
    var nonEvmTransactions = transactionsController.nonEvmTransactions;
    var newNonEvmTransactions = {};
    // Migrate each account's transactions to the new nested structure
    for (var _i = 0, _d = Object.entries(nonEvmTransactions); _i < _d.length; _i++) {
        var _e = _d[_i], accountId = _e[0], accountTransactions = _e[1];
        // Check if this account is already in the new format
        if (isAlreadyMigrated(accountTransactions)) {
            // Already migrated, keep the existing structure
            newNonEvmTransactions[accountId] = accountTransactions;
            continue;
        }
        if (!isValidTransactionStateEntry(accountTransactions)) {
            throw new Error("Invalid transaction state entry for account ".concat(accountId, ": expected TransactionStateEntry, got ").concat(typeof accountTransactions));
        }
        // Creates the new structure for this account
        // Since we know the transactions are from Solana, we use the Solana chainId
        // 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' is Solana mainnet (the only supported so far)
        newNonEvmTransactions[accountId] = (_a = {},
            _a[SOLANA_MAINNET_ADDRESS] = {
                transactions: accountTransactions.transactions,
                next: accountTransactions.next,
                lastUpdated: accountTransactions.lastUpdated,
            },
            _a);
    }
    // Update the state with the new structure
    transactionsController.nonEvmTransactions = newNonEvmTransactions;
    return state;
}
