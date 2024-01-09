"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicDeployer = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
/**
 * wrapper class for Arachnid's deterministic deployer
 * (deterministic deployer used by 'hardhat-deployer'. generates the same addresses as "hardhat-deploy")
 */
class DeterministicDeployer {
    static getAddress(ctrCode, salt = 0, params = []) {
        return DeterministicDeployer.getDeterministicDeployAddress(ctrCode, salt, params);
    }
    static async deploy(ctrCode, salt = 0, params = []) {
        return await DeterministicDeployer.instance.deterministicDeploy(ctrCode, salt, params);
    }
    constructor(provider, signer) {
        this.provider = provider;
        this.signer = signer;
    }
    async isContractDeployed(address) {
        return await this.provider.getCode(address).then(code => code.length > 2);
    }
    async isDeployerDeployed() {
        return await this.isContractDeployed(DeterministicDeployer.proxyAddress);
    }
    async deployFactory() {
        var _a;
        if (await this.isContractDeployed(DeterministicDeployer.proxyAddress)) {
            return;
        }
        const bal = await this.provider.getBalance(DeterministicDeployer.deploymentSignerAddress);
        const neededBalance = ethers_1.BigNumber.from(DeterministicDeployer.deploymentGasLimit).mul(DeterministicDeployer.deploymentGasPrice);
        if (bal.lt(neededBalance)) {
            const signer = (_a = this.signer) !== null && _a !== void 0 ? _a : this.provider.getSigner();
            await signer.sendTransaction({
                to: DeterministicDeployer.deploymentSignerAddress,
                value: neededBalance,
                gasLimit: DeterministicDeployer.deploymentGasLimit
            });
        }
        await this.provider.send('eth_sendRawTransaction', [DeterministicDeployer.deploymentTransaction]);
        if (!await this.isContractDeployed(DeterministicDeployer.proxyAddress)) {
            throw new Error('raw TX didn\'t deploy deployer!');
        }
    }
    async getDeployTransaction(ctrCode, salt = 0, params = []) {
        await this.deployFactory();
        const saltEncoded = (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(salt), 32);
        const ctrEncoded = DeterministicDeployer.getCtrCode(ctrCode, params);
        return {
            to: DeterministicDeployer.proxyAddress,
            data: (0, utils_1.hexConcat)([
                saltEncoded,
                ctrEncoded
            ])
        };
    }
    static getCtrCode(ctrCode, params) {
        if (typeof ctrCode !== 'string') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return (0, utils_1.hexlify)(ctrCode.getDeployTransaction(...params).data);
        }
        else {
            if (params.length !== 0) {
                throw new Error('constructor params can only be passed to ContractFactory');
            }
            return ctrCode;
        }
    }
    static getDeterministicDeployAddress(ctrCode, salt = 0, params = []) {
        // this method works only before the contract is already deployed:
        // return await this.provider.call(await this.getDeployTransaction(ctrCode, salt))
        const saltEncoded = (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(salt), 32);
        const ctrCode1 = DeterministicDeployer.getCtrCode(ctrCode, params);
        return '0x' + (0, utils_1.keccak256)((0, utils_1.hexConcat)([
            '0xff',
            DeterministicDeployer.proxyAddress,
            saltEncoded,
            (0, utils_1.keccak256)(ctrCode1)
        ])).slice(-40);
    }
    async deterministicDeploy(ctrCode, salt = 0, params = []) {
        var _a;
        const addr = DeterministicDeployer.getDeterministicDeployAddress(ctrCode, salt, params);
        if (!await this.isContractDeployed(addr)) {
            const signer = (_a = this.signer) !== null && _a !== void 0 ? _a : this.provider.getSigner();
            await signer.sendTransaction(await this.getDeployTransaction(ctrCode, salt, params));
        }
        return addr;
    }
    static init(provider, signer) {
        this._instance = new DeterministicDeployer(provider, signer);
    }
    static get instance() {
        if (this._instance == null) {
            throw new Error('must call "DeterministicDeployer.init(ethers.provider)" first');
        }
        return this._instance;
    }
}
exports.DeterministicDeployer = DeterministicDeployer;
// from: https://github.com/Arachnid/deterministic-deployment-proxy
DeterministicDeployer.proxyAddress = '0x4e59b44847b379578588920ca78fbf26c0b4956c';
DeterministicDeployer.deploymentTransaction = '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222';
DeterministicDeployer.deploymentSignerAddress = '0x3fab184622dc19b6109349b94811493bf2a45362';
DeterministicDeployer.deploymentGasPrice = 100e9;
DeterministicDeployer.deploymentGasLimit = 100000;
//# sourceMappingURL=DeterministicDeployer.js.map