"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionHistory = exports.addInitialHistorySnapshot = void 0;
const fast_json_patch_1 = __importDefault(require("fast-json-patch"));
const lodash_1 = require("lodash");
/**
 * Add initial history snapshot to the provided transactionMeta history.
 *
 * @param transactionMeta - TransactionMeta to add initial history snapshot to.
 */
function addInitialHistorySnapshot(transactionMeta) {
    const snapshot = snapshotFromTransactionMeta(transactionMeta);
    transactionMeta.history = [snapshot];
}
exports.addInitialHistorySnapshot = addInitialHistorySnapshot;
/**
 * Compares and adds history entry to the provided transactionMeta history.
 *
 * @param transactionMeta - TransactionMeta to add history entry to.
 * @param note - Note to add to history entry.
 */
function updateTransactionHistory(transactionMeta, note) {
    var _a;
    if (!transactionMeta.history) {
        return;
    }
    const currentState = snapshotFromTransactionMeta(transactionMeta);
    const previousState = replayHistory(transactionMeta.history);
    const historyEntry = generateHistoryEntry(previousState, currentState, note);
    if (historyEntry.length) {
        (_a = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.history) === null || _a === void 0 ? void 0 : _a.push(historyEntry);
    }
}
exports.updateTransactionHistory = updateTransactionHistory;
/**
 * Generates a history entry from the previous and new transaction metadata.
 *
 * @param previousState - The previous transaction metadata.
 * @param currentState - The new transaction metadata.
 * @param note - A note for the transaction metada update.
 * @returns An array of history operation.
 */
function generateHistoryEntry(
// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
previousState, currentState, note) {
    const historyOperationsEntry = fast_json_patch_1.default.compare(previousState, currentState);
    // Add a note to the first operation, since it breaks if we append it to the entry
    if (historyOperationsEntry[0]) {
        if (note) {
            historyOperationsEntry[0].note = note;
        }
        historyOperationsEntry[0].timestamp = Date.now();
    }
    return historyOperationsEntry;
}
/**
 * Recovers previous transactionMeta from passed history array.
 *
 * @param transactionHistory - The transaction metadata to replay.
 * @returns The transaction metadata.
 */
function replayHistory(transactionHistory) {
    const shortHistory = (0, lodash_1.cloneDeep)(transactionHistory);
    return shortHistory.reduce(
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (val, entry) => fast_json_patch_1.default.applyPatch(val, entry).newDocument);
}
/**
 * Clone the transaction meta data without the history property.
 *
 * @param transactionMeta - The transaction metadata to snapshot.
 * @returns A deep clone of transaction metadata without history property.
 */
function snapshotFromTransactionMeta(transactionMeta) {
    const snapshot = Object.assign({}, transactionMeta);
    delete snapshot.history;
    return (0, lodash_1.cloneDeep)(snapshot);
}
//# sourceMappingURL=history.js.map