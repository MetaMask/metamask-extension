import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type { TestTimeRangeAccountFactory, TestTimeRangeAccountFactoryInterface } from "../../../../contracts/tests/TestTimeRangeAccount.sol/TestTimeRangeAccountFactory";
type TestTimeRangeAccountFactoryConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestTimeRangeAccountFactory__factory extends ContractFactory {
    constructor(...args: TestTimeRangeAccountFactoryConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestTimeRangeAccountFactory>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestTimeRangeAccountFactory;
    connect(signer: Signer): TestTimeRangeAccountFactory__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506102ed806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063b6a46b3b14610030575b600080fd5b61004361003e3660046100bb565b61005f565b6040516001600160a01b03909116815260200160405180910390f35b60008060001b60405161007190610098565b8190604051809103906000f5905080158015610091573d6000803e3d6000fd5b5092915050565b61014b8061016d83390190565b634e487b7160e01b600052604160045260246000fd5b6000602082840312156100cd57600080fd5b813567ffffffffffffffff808211156100e557600080fd5b818401915084601f8301126100f957600080fd5b81358181111561010b5761010b6100a5565b604051601f8201601f19908116603f01168101908382118183101715610133576101336100a5565b8160405282815287602084870101111561014c57600080fd5b82602086016020830137600092810160200192909252509594505050505056fe608060405234801561001057600080fd5b5061012b806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633a871cdd14602d575b600080fd5b603c603836600460a4565b604e565b60405190815260200160405180910390f35b600060c08401356101008501356064838284606e565b9695505050505050565b600060d08265ffffffffffff16901b60a08465ffffffffffff16901b8560945760006097565b60015b60ff161717949350505050565b60008060006060848603121560b857600080fd5b833567ffffffffffffffff81111560ce57600080fd5b8401610160818703121560e057600080fd5b9560208501359550604090940135939250505056fea2646970667358221220402fd592ecd91b7c60e5c53a6e733d3fdd52f7ad6930bef0ef2c5c18e62a7b1264736f6c634300080f0033a264697066735822122061531dc6efbeadf5949243e90db8efb375fa1dd7636c2d03182c3eec6a56835464736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly name: "create";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TestTimeRangeAccountFactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestTimeRangeAccountFactory;
}
export {};
