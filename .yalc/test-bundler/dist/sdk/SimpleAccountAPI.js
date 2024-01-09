"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAccountAPI = void 0;
const ethers_1 = require("ethers");
const contracts_1 = require("@account-abstraction/contracts");
const utils_1 = require("ethers/lib/utils");
const BaseAccountAPI_1 = require("./BaseAccountAPI");
/**
 * An implementation of the BaseAccountAPI using the SimpleAccount contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
class SimpleAccountAPI extends BaseAccountAPI_1.BaseAccountAPI {
    constructor(params) {
        var _a;
        super(params);
        this.factoryAddress = params.factoryAddress;
        this.owner = params.owner;
        this.index = ethers_1.BigNumber.from((_a = params.index) !== null && _a !== void 0 ? _a : 0);
    }
    async _getAccountContract() {
        if (this.accountContract == null) {
            this.accountContract = contracts_1.SimpleAccount__factory.connect(await this.getAccountAddress(), this.provider);
        }
        return this.accountContract;
    }
    /**
     * return the value to put into the "initCode" field, if the account is not yet deployed.
     * this value holds the "factory" address, followed by this account's information
     */
    async getAccountInitCode() {
        if (this.factory == null) {
            if (this.factoryAddress != null && this.factoryAddress !== '') {
                this.factory = contracts_1.SimpleAccountFactory__factory.connect(this.factoryAddress, this.provider);
            }
            else {
                throw new Error('no factory to get initCode');
            }
        }
        return (0, utils_1.hexConcat)([
            this.factory.address,
            this.factory.interface.encodeFunctionData('createAccount', [await this.owner.getAddress(), this.index])
        ]);
    }
    async getNonce() {
        if (await this.checkAccountPhantom()) {
            return ethers_1.BigNumber.from(0);
        }
        const accountContract = await this._getAccountContract();
        return await accountContract.getNonce();
    }
    /**
     * encode a method call from entryPoint to our contract
     * @param target
     * @param value
     * @param data
     */
    async encodeExecute(target, value, data) {
        const accountContract = await this._getAccountContract();
        return accountContract.interface.encodeFunctionData('execute', [
            target,
            value,
            data
        ]);
    }
    async signUserOpHash(userOpHash) {
        return await this.owner.signMessage((0, utils_1.arrayify)(userOpHash));
    }
}
exports.SimpleAccountAPI = SimpleAccountAPI;
//# sourceMappingURL=SimpleAccountAPI.js.map