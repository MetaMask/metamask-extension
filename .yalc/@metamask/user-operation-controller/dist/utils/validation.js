"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSignUserOperationResponse = exports.validateUpdateUserOperationResponse = exports.validatePrepareUserOperationResponse = exports.validateAddUserOperationOptions = exports.validateAddUserOperationRequest = void 0;
const transaction_controller_1 = require("@metamask/transaction-controller");
const utils_1 = require("@metamask/utils");
const superstruct_1 = require("superstruct");
const constants_1 = require("../constants");
/**
 * Validate a request to add a user operation.
 * @param request - The request to validate.
 */
function validateAddUserOperationRequest(request) {
    const Hex = defineHex();
    const HexOrEmptyBytes = defineHexOrEmptyBytes();
    const ValidRequest = (0, superstruct_1.object)({
        data: (0, superstruct_1.optional)(HexOrEmptyBytes),
        from: Hex,
        maxFeePerGas: (0, superstruct_1.optional)(Hex),
        maxPriorityFeePerGas: (0, superstruct_1.optional)(Hex),
        to: (0, superstruct_1.optional)(Hex),
        value: (0, superstruct_1.optional)(Hex),
    });
    validate(request, ValidRequest, 'Invalid request to add user operation');
}
exports.validateAddUserOperationRequest = validateAddUserOperationRequest;
/**
 * Validate the options when adding a user operation.
 * @param options - The options to validate.
 */
function validateAddUserOperationOptions(options) {
    const ValidOptions = (0, superstruct_1.object)({
        networkClientId: (0, superstruct_1.string)(),
        origin: (0, superstruct_1.string)(),
        requireApproval: (0, superstruct_1.optional)((0, superstruct_1.boolean)()),
        smartContractAccount: (0, superstruct_1.optional)((0, superstruct_1.object)({
            prepareUserOperation: (0, superstruct_1.func)(),
            updateUserOperation: (0, superstruct_1.func)(),
            signUserOperation: (0, superstruct_1.func)(),
        })),
        swaps: (0, superstruct_1.optional)((0, superstruct_1.object)({
            approvalTxId: (0, superstruct_1.optional)((0, superstruct_1.string)()),
            destinationTokenAddress: (0, superstruct_1.optional)((0, superstruct_1.string)()),
            destinationTokenDecimals: (0, superstruct_1.optional)((0, superstruct_1.number)()),
            destinationTokenSymbol: (0, superstruct_1.optional)((0, superstruct_1.string)()),
            estimatedBaseFee: (0, superstruct_1.optional)((0, superstruct_1.string)()),
            sourceTokenSymbol: (0, superstruct_1.optional)((0, superstruct_1.string)()),
            swapMetaData: (0, superstruct_1.optional)((0, superstruct_1.object)()),
            swapTokenValue: (0, superstruct_1.optional)((0, superstruct_1.string)()),
        })),
        type: (0, superstruct_1.optional)((0, superstruct_1.enums)(Object.values(transaction_controller_1.TransactionType))),
    });
    validate(options, ValidOptions, 'Invalid options to add user operation');
}
exports.validateAddUserOperationOptions = validateAddUserOperationOptions;
/**
 * Validate the response from a smart contract account when preparing the user operation.
 * @param response - The response to validate.
 */
function validatePrepareUserOperationResponse(response) {
    const Hex = defineHex();
    const HexOrEmptyBytes = defineHexOrEmptyBytes();
    const ValidResponse = (0, superstruct_1.refine)((0, superstruct_1.object)({
        bundler: (0, superstruct_1.string)(),
        callData: Hex,
        dummyPaymasterAndData: (0, superstruct_1.optional)(HexOrEmptyBytes),
        dummySignature: (0, superstruct_1.optional)(HexOrEmptyBytes),
        gas: (0, superstruct_1.optional)((0, superstruct_1.object)({
            callGasLimit: Hex,
            preVerificationGas: Hex,
            verificationGasLimit: Hex,
        })),
        initCode: (0, superstruct_1.optional)(HexOrEmptyBytes),
        nonce: Hex,
        sender: Hex,
    }), 'ValidPrepareUserOperationResponse', ({ gas, dummySignature }) => {
        if (!gas && (!dummySignature || dummySignature === constants_1.EMPTY_BYTES)) {
            return 'Must specify dummySignature if not specifying gas';
        }
        /* istanbul ignore next */
        return true;
    });
    validate(response, ValidResponse, 'Invalid response when preparing user operation');
}
exports.validatePrepareUserOperationResponse = validatePrepareUserOperationResponse;
/**
 * Validate the response from a smart contract account when updating the user operation.
 * @param response - The response to validate.
 */
function validateUpdateUserOperationResponse(response) {
    const HexOrEmptyBytes = defineHex();
    const ValidResponse = (0, superstruct_1.optional)((0, superstruct_1.object)({
        paymasterAndData: (0, superstruct_1.optional)(HexOrEmptyBytes),
    }));
    validate(response, ValidResponse, 'Invalid response when updating user operation');
}
exports.validateUpdateUserOperationResponse = validateUpdateUserOperationResponse;
/**
 * Validate the response from a smart contract account when signing the user operation.
 * @param response - The response to validate.
 */
function validateSignUserOperationResponse(response) {
    const Hex = defineHex();
    const ValidResponse = (0, superstruct_1.object)({
        signature: Hex,
    });
    validate(response, ValidResponse, 'Invalid response when signing user operation');
}
exports.validateSignUserOperationResponse = validateSignUserOperationResponse;
/**
 * Validate data against a struct.
 * @param data - The data to validate.
 * @param struct - The struct to validate against.
 * @param message - The message to throw if validation fails.
 */
function validate(data, struct, message) {
    try {
        (0, superstruct_1.assert)(data, struct, message);
    }
    catch (error) {
        const causes = error
            .failures()
            .map((failure) => {
            if (!failure.path.length) {
                return failure.message;
            }
            return `${failure.path.join('.')} - ${failure.message}`;
        })
            .join('\n');
        const finalMessage = `${message}\n${causes}`;
        throw new Error(finalMessage);
    }
}
/**
 * Define the Hex type used by superstruct.
 * @returns The Hex superstruct type.
 */
function defineHex() {
    return (0, superstruct_1.define)('Hexadecimal String', (value) => (0, utils_1.isStrictHexString)(value));
}
/**
 * Define the HexOrEmptyBytes type used by superstruct.
 * @returns The HexOrEmptyBytes superstruct type.
 */
function defineHexOrEmptyBytes() {
    return (0, superstruct_1.define)('Hexadecimal String or 0x', (value) => (0, utils_1.isStrictHexString)(value) || value === constants_1.EMPTY_BYTES);
}
//# sourceMappingURL=validation.js.map