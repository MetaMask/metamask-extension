"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationManager = void 0;
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const BundlerCollectorTracer_1 = require("./BundlerCollectorTracer");
const GethTracer_1 = require("./GethTracer");
const TracerResultParser_1 = require("./TracerResultParser");
const contract_types_1 = require("../contract-types");
const sdk_1 = require("../sdk");
const utils_1 = require("../utils");
const debug = (0, debug_1.default)('aa.mgr.validate');
// how much time into the future a UserOperation must be valid in order to be accepted
const VALID_UNTIL_FUTURE_SECONDS = 30;
const HEX_REGEX = /^0x[a-fA-F\d]*$/i;
class ValidationManager {
    constructor(entryPoint, unsafe) {
        this.entryPoint = entryPoint;
        this.unsafe = unsafe;
    }
    // standard eth_call to simulateValidation
    async _callSimulateValidation(userOp) {
        const errorResult = await this.entryPoint.callStatic
            .simulateValidation(userOp, { gasLimit: 10e6 })
            .catch((e) => e);
        return this._parseErrorResult(userOp, errorResult);
    }
    _parseErrorResult(userOp, errorResult) {
        var _a, _b, _c;
        if (!((_a = errorResult === null || errorResult === void 0 ? void 0 : errorResult.errorName) === null || _a === void 0 ? void 0 : _a.startsWith('ValidationResult'))) {
            // parse it as FailedOp
            // if its FailedOp, then we have the paymaster param... otherwise its an Error(string)
            let { paymaster } = errorResult.errorArgs;
            if (paymaster === utils_1.AddressZero) {
                paymaster = undefined;
            }
            // eslint-disable-next-line
            const msg = (_c = (_b = errorResult.errorArgs) === null || _b === void 0 ? void 0 : _b.reason) !== null && _c !== void 0 ? _c : errorResult.toString();
            if (paymaster == null) {
                throw new utils_1.RpcError(`account validation failed: ${msg}`, utils_1.ValidationErrors.SimulateValidation);
            }
            else {
                throw new utils_1.RpcError(`paymaster validation failed: ${msg}`, utils_1.ValidationErrors.SimulatePaymasterValidation, { paymaster });
            }
        }
        const { returnInfo, senderInfo, factoryInfo, paymasterInfo, aggregatorInfo, // may be missing (exists only SimulationResultWithAggregator
         } = errorResult.errorArgs;
        // extract address from "data" (first 20 bytes)
        // add it as "addr" member to the "stakeinfo" struct
        // if no address, then return "undefined" instead of struct.
        /**
         *
         * @param data
         * @param info
         */
        function fillEntity(data, info) {
            const addr = (0, utils_1.getAddr)(data);
            return addr == null
                ? undefined
                : Object.assign(Object.assign({}, info), { addr });
        }
        return {
            returnInfo,
            senderInfo: Object.assign(Object.assign({}, senderInfo), { addr: userOp.sender }),
            factoryInfo: fillEntity(userOp.initCode, factoryInfo),
            paymasterInfo: fillEntity(userOp.paymasterAndData, paymasterInfo),
            aggregatorInfo: fillEntity(aggregatorInfo === null || aggregatorInfo === void 0 ? void 0 : aggregatorInfo.actualAggregator, aggregatorInfo === null || aggregatorInfo === void 0 ? void 0 : aggregatorInfo.stakeInfo),
        };
    }
    async _geth_traceCall_SimulateValidation(userOp) {
        var _a, _b;
        const provider = this.entryPoint.provider;
        const simulateCall = this.entryPoint.interface.encodeFunctionData('simulateValidation', [userOp]);
        const simulationGas = ethers_1.BigNumber.from(userOp.preVerificationGas).add(userOp.verificationGasLimit);
        const tracerResult = await (0, GethTracer_1.debug_traceCall)(provider, {
            from: ethers_1.ethers.constants.AddressZero,
            to: this.entryPoint.address,
            data: simulateCall,
            gasLimit: simulationGas,
        }, { tracer: BundlerCollectorTracer_1.bundlerCollectorTracer });
        const lastResult = tracerResult.calls.slice(-1)[0];
        if (lastResult.type !== 'REVERT') {
            throw new Error('Invalid response. simulateCall must revert');
        }
        const { data } = lastResult;
        // Hack to handle SELFDESTRUCT until we fix entrypoint
        if (data === '0x') {
            return [data, tracerResult];
        }
        try {
            const { name: errorName, args: errorArgs } = this.entryPoint.interface.parseError(data);
            const errFullName = `${errorName}(${errorArgs.toString()})`;
            const errorResult = this._parseErrorResult(userOp, {
                errorName,
                errorArgs,
            });
            if (!errorName.includes('Result')) {
                // a real error, not a result.
                throw new Error(errFullName);
            }
            debug('==dump tree=', JSON.stringify(tracerResult, null, 2)
                .replace(new RegExp(userOp.sender.toLowerCase()), '{sender}')
                .replace(new RegExp((_a = (0, utils_1.getAddr)(userOp.paymasterAndData)) !== null && _a !== void 0 ? _a : '--no-paymaster--'), '{paymaster}')
                .replace(new RegExp((_b = (0, utils_1.getAddr)(userOp.initCode)) !== null && _b !== void 0 ? _b : '--no-initcode--'), '{factory}'));
            // console.log('==debug=', ...tracerResult.numberLevels.forEach(x=>x.access), 'sender=', userOp.sender, 'paymaster=', hexlify(userOp.paymasterAndData)?.slice(0, 42))
            // errorResult is "ValidationResult"
            return [errorResult, tracerResult];
        }
        catch (e) {
            // if already parsed, throw as is
            if (e.code != null) {
                throw e;
            }
            // not a known error of EntryPoint (probably, only Error(string), since FailedOp is handled above)
            const err = (0, utils_1.decodeErrorReason)(data);
            throw new utils_1.RpcError(err != null ? err.message : data, 111);
        }
    }
    /**
     * validate UserOperation.
     * should also handle unmodified memory (e.g. by referencing cached storage in the mempool
     * one item to check that was un-modified is the aggregator..
     * @param userOp
     * @param previousCodeHashes
     * @param checkStakes
     */
    async validateUserOp(userOp, previousCodeHashes, checkStakes = true) {
        if (previousCodeHashes != null && previousCodeHashes.addresses.length > 0) {
            const { hash: codeHashes } = await this.getCodeHashes(previousCodeHashes.addresses);
            // [COD-010]
            (0, utils_1.requireCond)(codeHashes === previousCodeHashes.hash, 'modified code after first validation', utils_1.ValidationErrors.OpcodeValidation);
        }
        let res;
        let codeHashes = {
            addresses: [],
            hash: '',
        };
        let storageMap = {};
        if (!this.unsafe) {
            let tracerResult;
            [res, tracerResult] = await this._geth_traceCall_SimulateValidation(userOp);
            let contractAddresses;
            [contractAddresses, storageMap] = (0, TracerResultParser_1.tracerResultParser)(userOp, tracerResult, res, this.entryPoint);
            // if no previous contract hashes, then calculate hashes of contracts
            if (previousCodeHashes == null) {
                codeHashes = await this.getCodeHashes(contractAddresses);
            }
            if (res === '0x') {
                throw new Error('simulateValidation reverted with no revert string!');
            }
        }
        else {
            // NOTE: this mode doesn't do any opcode checking and no stake checking!
            res = await this._callSimulateValidation(userOp);
        }
        (0, utils_1.requireCond)(!res.returnInfo.sigFailed, 'Invalid UserOp signature or paymaster signature', utils_1.ValidationErrors.InvalidSignature);
        const now = Math.floor(Date.now() / 1000);
        (0, utils_1.requireCond)(res.returnInfo.validAfter <= now, 'time-range in the future time', utils_1.ValidationErrors.NotInTimeRange);
        console.log('until', res.returnInfo.validUntil, 'now=', now);
        (0, utils_1.requireCond)(res.returnInfo.validUntil == null || res.returnInfo.validUntil >= now, 'already expired', utils_1.ValidationErrors.NotInTimeRange);
        (0, utils_1.requireCond)(res.returnInfo.validUntil == null ||
            res.returnInfo.validUntil > now + VALID_UNTIL_FUTURE_SECONDS, 'expires too soon', utils_1.ValidationErrors.NotInTimeRange);
        (0, utils_1.requireCond)(res.aggregatorInfo == null, 'Currently not supporting aggregator', utils_1.ValidationErrors.UnsupportedSignatureAggregator);
        return Object.assign(Object.assign({}, res), { referencedContracts: codeHashes, storageMap });
    }
    async getCodeHashes(addresses) {
        const { hash } = await (0, utils_1.runContractScript)(this.entryPoint.provider, new contract_types_1.CodeHashGetter__factory(), [addresses]);
        return {
            hash,
            addresses,
        };
    }
    /**
     * perform static checking on input parameters.
     * @param userOp
     * @param entryPointInput
     * @param requireSignature
     * @param requireGasParams
     */
    validateInputParameters(userOp, entryPointInput, requireSignature = true, requireGasParams = true) {
        (0, utils_1.requireCond)(entryPointInput != null, 'No entryPoint param', utils_1.ValidationErrors.InvalidFields);
        (0, utils_1.requireCond)(entryPointInput.toLowerCase() === this.entryPoint.address.toLowerCase(), `The EntryPoint at "${entryPointInput}" is not supported. This bundler uses ${this.entryPoint.address}`, utils_1.ValidationErrors.InvalidFields);
        // minimal sanity check: userOp exists, and all members are hex
        (0, utils_1.requireCond)(userOp != null, 'No UserOperation param', utils_1.ValidationErrors.InvalidFields);
        const fields = [
            'sender',
            'nonce',
            'initCode',
            'callData',
            'paymasterAndData',
        ];
        if (requireSignature) {
            fields.push('signature');
        }
        if (requireGasParams) {
            fields.push('preVerificationGas', 'verificationGasLimit', 'callGasLimit', 'maxFeePerGas', 'maxPriorityFeePerGas');
        }
        fields.forEach((key) => {
            var _a;
            const value = (_a = userOp[key]) === null || _a === void 0 ? void 0 : _a.toString();
            (0, utils_1.requireCond)(value != null, `Missing userOp field: ${key} ${JSON.stringify(userOp)}`, utils_1.ValidationErrors.InvalidFields);
            (0, utils_1.requireCond)(value.match(HEX_REGEX) != null, `Invalid hex value for property ${key}:${value} in UserOp`, utils_1.ValidationErrors.InvalidFields);
        });
        (0, utils_1.requireCond)(userOp.paymasterAndData.length === 2 ||
            userOp.paymasterAndData.length >= 42, 'paymasterAndData: must contain at least an address', utils_1.ValidationErrors.InvalidFields);
        // syntactically, initCode can be only the deployer address. but in reality, it must have calldata to uniquely identify the account
        (0, utils_1.requireCond)(userOp.initCode.length === 2 || userOp.initCode.length >= 42, 'initCode: must contain at least an address', utils_1.ValidationErrors.InvalidFields);
        const calcPreVerificationGas1 = (0, sdk_1.calcPreVerificationGas)(userOp);
        (0, utils_1.requireCond)(userOp.preVerificationGas >= calcPreVerificationGas1, `preVerificationGas too low: expected at least ${calcPreVerificationGas1}`, utils_1.ValidationErrors.InvalidFields);
    }
}
exports.ValidationManager = ValidationManager;
//# sourceMappingURL=ValidationManager.js.map