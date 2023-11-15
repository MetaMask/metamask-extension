"use strict";
/* eslint-disable jsdoc/require-jsdoc */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSnapUserOperationSignatureRequest = exports.sendSnapPaymasterRequest = exports.sendSnapUserOperationRequest = void 0;
const simple_account_1 = __importDefault(require("./simple-account"));
const SNAPS_BY_ID = {
    'simple-account': simple_account_1.default,
};
function sendSnapUserOperationRequest(snapId, request) {
    return getAccountSnap(snapId).onUserOperationRequest(request);
}
exports.sendSnapUserOperationRequest = sendSnapUserOperationRequest;
function sendSnapPaymasterRequest(snapId, request) {
    return getAccountSnap(snapId).onPaymasterRequest(request);
}
exports.sendSnapPaymasterRequest = sendSnapPaymasterRequest;
function sendSnapUserOperationSignatureRequest(snapId, request) {
    return getAccountSnap(snapId).onUserOperationSignatureRequest(request);
}
exports.sendSnapUserOperationSignatureRequest = sendSnapUserOperationSignatureRequest;
function getAccountSnap(snapId) {
    const idKey = snapId;
    const accountSnap = SNAPS_BY_ID[idKey];
    if (!accountSnap) {
        throw new Error(`No SCA snap found for ID: ${snapId}`);
    }
    return accountSnap;
}
//# sourceMappingURL=index.js.map