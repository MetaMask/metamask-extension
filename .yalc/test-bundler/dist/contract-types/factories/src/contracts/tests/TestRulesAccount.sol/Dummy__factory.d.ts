import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type { Dummy, DummyInterface } from "../../../../../src/contracts/tests/TestRulesAccount.sol/Dummy";
type DummyConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class Dummy__factory extends ContractFactory {
    constructor(...args: DummyConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<Dummy>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): Dummy;
    connect(signer: Signer): Dummy__factory;
    static readonly bytecode = "0x60806040526001600055348015601457600080fd5b50607d806100236000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b603560005481565b60405190815260200160405180910390f3fea26469706673582212206968679cb502cb12053d097bc2d3b605e32741a88729073745daedd6d3da9e4e64736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "value";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): DummyInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Dummy;
}
export {};
