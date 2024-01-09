import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type { TestTimeRangeAccount, TestTimeRangeAccountInterface } from "../../../../../src/contracts/tests/TestTimeRangeAccount.sol/TestTimeRangeAccount";
type TestTimeRangeAccountConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestTimeRangeAccount__factory extends ContractFactory {
    constructor(...args: TestTimeRangeAccountConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestTimeRangeAccount>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestTimeRangeAccount;
    connect(signer: Signer): TestTimeRangeAccount__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b5061012b806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633a871cdd14602d575b600080fd5b603c603836600460a4565b604e565b60405190815260200160405180910390f35b600060c08401356101008501356064838284606e565b9695505050505050565b600060d08265ffffffffffff16901b60a08465ffffffffffff16901b8560945760006097565b60015b60ff161717949350505050565b60008060006060848603121560b857600080fd5b833567ffffffffffffffff81111560ce57600080fd5b8401610160818703121560e057600080fd5b9560208501359550604090940135939250505056fea2646970667358221220a6429105f6fb6a8406f868e2ddf0c288eb434391c90286b5c9c981a90f9f34a064736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address";
                readonly name: "sender";
                readonly type: "address";
            }, {
                readonly internalType: "uint256";
                readonly name: "nonce";
                readonly type: "uint256";
            }, {
                readonly internalType: "bytes";
                readonly name: "initCode";
                readonly type: "bytes";
            }, {
                readonly internalType: "bytes";
                readonly name: "callData";
                readonly type: "bytes";
            }, {
                readonly internalType: "uint256";
                readonly name: "callGasLimit";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "verificationGasLimit";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "preVerificationGas";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "maxFeePerGas";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "maxPriorityFeePerGas";
                readonly type: "uint256";
            }, {
                readonly internalType: "bytes";
                readonly name: "paymasterAndData";
                readonly type: "bytes";
            }, {
                readonly internalType: "bytes";
                readonly name: "signature";
                readonly type: "bytes";
            }];
            readonly internalType: "struct UserOperation";
            readonly name: "userOp";
            readonly type: "tuple";
        }, {
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "validateUserOp";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TestTimeRangeAccountInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestTimeRangeAccount;
}
export {};
