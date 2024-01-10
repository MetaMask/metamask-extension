import { BigNumberish, ContractFactory } from 'ethers';
import { TransactionRequest } from '@ethersproject/abstract-provider';
import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
/**
 * wrapper class for Arachnid's deterministic deployer
 * (deterministic deployer used by 'hardhat-deployer'. generates the same addresses as "hardhat-deploy")
 */
export declare class DeterministicDeployer {
    readonly provider: JsonRpcProvider;
    readonly signer?: Signer | undefined;
    /**
     * return the address this code will get deployed to.
     * @param ctrCode constructor code to pass to CREATE2, or ContractFactory
     * @param salt optional salt. defaults to zero
     */
    static getAddress(ctrCode: string, salt: BigNumberish): string;
    static getAddress(ctrCode: string): string;
    static getAddress(ctrCode: ContractFactory, salt: BigNumberish, params: any[]): string;
    /**
     * deploy the contract, unless already deployed
     * @param ctrCode constructor code to pass to CREATE2 or ContractFactory
     * @param salt optional salt. defaults to zero
     * @return the deployed address
     */
    static deploy(ctrCode: string, salt: BigNumberish): Promise<string>;
    static deploy(ctrCode: string): Promise<string>;
    static deploy(ctrCode: ContractFactory, salt: BigNumberish, params: any[]): Promise<string>;
    static proxyAddress: string;
    static deploymentTransaction: string;
    static deploymentSignerAddress: string;
    static deploymentGasPrice: number;
    static deploymentGasLimit: number;
    constructor(provider: JsonRpcProvider, signer?: Signer | undefined);
    isContractDeployed(address: string): Promise<boolean>;
    isDeployerDeployed(): Promise<boolean>;
    deployFactory(): Promise<void>;
    getDeployTransaction(ctrCode: string | ContractFactory, salt?: BigNumberish, params?: any[]): Promise<TransactionRequest>;
    static getCtrCode(ctrCode: string | ContractFactory, params: any[]): string;
    static getDeterministicDeployAddress(ctrCode: string | ContractFactory, salt?: BigNumberish, params?: any[]): string;
    deterministicDeploy(ctrCode: string | ContractFactory, salt?: BigNumberish, params?: any[]): Promise<string>;
    private static _instance?;
    static init(provider: JsonRpcProvider, signer?: JsonRpcSigner): void;
    static get instance(): DeterministicDeployer;
}
