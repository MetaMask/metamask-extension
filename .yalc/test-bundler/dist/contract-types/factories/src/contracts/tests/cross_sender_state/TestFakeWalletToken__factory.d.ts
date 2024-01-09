import { Signer, ContractFactory, PayableOverrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type { TestFakeWalletToken, TestFakeWalletTokenInterface } from "../../../../../src/contracts/tests/cross_sender_state/TestFakeWalletToken";
type TestFakeWalletTokenConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestFakeWalletToken__factory extends ContractFactory {
    constructor(...args: TestFakeWalletTokenConstructorParams);
    deploy(_ep: PromiseOrValue<string>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestFakeWalletToken>;
    getDeployTransaction(_ep: PromiseOrValue<string>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestFakeWalletToken;
    connect(signer: Signer): TestFakeWalletToken__factory;
    static readonly bytecode = "0x608060405260405161047738038061047783398101604081905261002291610047565b600280546001600160a01b0319166001600160a01b0392909216919091179055610077565b60006020828403121561005957600080fd5b81516001600160a01b038116811461007057600080fd5b9392505050565b6103f1806100866000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631574d98a146100595780631593481a146100895780632d2299bc146100b35780633a871cdd146100e357806370a0823114610104575b005b60015461006c906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b610057610097366004610251565b6001600160a01b03909116600090815260208190526040902055565b6100576100c136600461027d565b600180546001600160a01b0319166001600160a01b0392909216919091179055565b6100f66100f13660046102a1565b61012d565b604051908152602001610080565b6100f661011236600461027d565b6001600160a01b031660009081526020819052604090205490565b600061013c60608501856102f5565b905060140361018457600061015460608601866102f5565b61016391601491600091610343565b61016c9161036d565b60601c6000908152602081905260408120555061022f565b6001546040516370a0823160e01b81523060048201526000916001600160a01b0316906370a0823190602401602060405180830381865afa1580156101cd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101f191906103a2565b1161022f5760405162461bcd60e51b815260206004820152600a6024820152696e6f2062616c616e636560b01b604482015260640160405180910390fd5b5060009392505050565b6001600160a01b038116811461024e57600080fd5b50565b6000806040838503121561026457600080fd5b823561026f81610239565b946020939093013593505050565b60006020828403121561028f57600080fd5b813561029a81610239565b9392505050565b6000806000606084860312156102b657600080fd5b833567ffffffffffffffff8111156102cd57600080fd5b840161016081870312156102e057600080fd5b95602085013595506040909401359392505050565b6000808335601e1984360301811261030c57600080fd5b83018035915067ffffffffffffffff82111561032757600080fd5b60200191503681900382131561033c57600080fd5b9250929050565b6000808585111561035357600080fd5b8386111561036057600080fd5b5050820193919092039150565b6bffffffffffffffffffffffff19813581811691601485101561039a5780818660140360031b1b83161692505b505092915050565b6000602082840312156103b457600080fd5b505191905056fea26469706673582212207cc30cca6111698ed9fb63c98686172b7b1960e7b526740b47c9c1013d989ff064736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_ep";
            readonly type: "address";
        }];
        readonly stateMutability: "payable";
        readonly type: "constructor";
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "fallback";
    }, {
        readonly inputs: readonly [];
        readonly name: "anotherWallet";
        readonly outputs: readonly [{
            readonly internalType: "contract TestFakeWalletToken";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_owner";
            readonly type: "address";
        }];
        readonly name: "balanceOf";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "balance";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract TestFakeWalletToken";
            readonly name: "_anotherWallet";
            readonly type: "address";
        }];
        readonly name: "sudoSetAnotherWallet";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "balance";
            readonly type: "uint256";
        }];
        readonly name: "sudoSetBalance";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
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
            readonly name: "validationData";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TestFakeWalletTokenInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestFakeWalletToken;
}
export {};
