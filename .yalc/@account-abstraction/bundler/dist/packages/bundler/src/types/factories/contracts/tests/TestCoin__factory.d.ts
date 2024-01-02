import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { TestCoin, TestCoinInterface } from "../../../contracts/tests/TestCoin";
type TestCoinConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestCoin__factory extends ContractFactory {
    constructor(...args: TestCoinConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestCoin>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestCoin;
    connect(signer: Signer): TestCoin__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506103f9806100206000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80636a6278421161005b5780636a627842146100ee57806370a0823114610101578063dd62ed3e1461012a578063ffdd5cf11461016357600080fd5b806325d9185c146100825780633b6a02f61461009d57806362a16020146100a5575b600080fd5b61008a610198565b6040519081526020015b60405180910390f35b61008a6101d6565b6100d36100b33660046102f0565b600260208190526000918252604090912080546001820154919092015483565b60408051938452602084019290925290820152606001610094565b61008a6100fc3660046102f0565b610237565b61008a61010f3660046102f0565b6001600160a01b031660009081526020819052604090205490565b61008a610138366004610312565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6101766101713660046102f0565b61026e565b6040805182518152602080840151908201529181015190820152606001610094565b60405162461bcd60e51b815260206004820152600c60248201526b1a5b9b995c8b5c995d995c9d60a21b604482015260009060640160405180910390fd5b60408051808201909152601781527f737472696e6720746f206265206475706c69636174656400000000000000000060208201526000905b8081604051602001610221929190610380565b604051602081830303815290604052905061020e565b6001600160a01b0381166000908152602081905260408120805460649190839061026290849061039d565b91829055509392505050565b61029260405180606001604052806000815260200160008152602001600081525090565b506001600160a01b0316600090815260026020818152604092839020835160608101855281548152600182015492810192909252909101549181019190915290565b80356001600160a01b03811681146102eb57600080fd5b919050565b60006020828403121561030257600080fd5b61030b826102d4565b9392505050565b6000806040838503121561032557600080fd5b61032e836102d4565b915061033c602084016102d4565b90509250929050565b6000815160005b81811015610366576020818501810151868301520161034c565b81811115610375576000828601525b509290920192915050565b600061039561038f8386610345565b84610345565b949350505050565b600082198211156103be57634e487b7160e01b600052601160045260246000fd5b50019056fea264697066735822122047df9bd90b9065b796d7faf0610b4183e98967beab888847f9047b3e5973112764736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "spender";
            readonly type: "address";
        }];
        readonly name: "allowance";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "addr";
            readonly type: "address";
        }];
        readonly name: "balanceOf";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "addr";
            readonly type: "address";
        }];
        readonly name: "getInfo";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint256";
                readonly name: "a";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "b";
                readonly type: "uint256";
            }, {
                readonly internalType: "uint256";
                readonly name: "c";
                readonly type: "uint256";
            }];
            readonly internalType: "struct TestCoin.Struct";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "addr";
            readonly type: "address";
        }];
        readonly name: "mint";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "reverting";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly name: "structInfo";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "a";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "b";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "c";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "wasteGas";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TestCoinInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestCoin;
}
export {};
