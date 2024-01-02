import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { TestRecursionAccount, TestRecursionAccountInterface } from "../../../contracts/tests/TestRecursionAccount";
type TestRecursionAccountConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestRecursionAccount__factory extends ContractFactory {
    constructor(...args: TestRecursionAccountConstructorParams);
    deploy(_ep: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestRecursionAccount>;
    getDeployTransaction(_ep: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestRecursionAccount;
    connect(signer: Signer): TestRecursionAccount__factory;
    static readonly bytecode = "0x60a060405234801561001057600080fd5b50604051610b4e380380610b4e83398101604081905261002f91610040565b6001600160a01b0316608052610070565b60006020828403121561005257600080fd5b81516001600160a01b038116811461006957600080fd5b9392505050565b608051610abc6100926000396000818161011001526103db0152610abc6000f3fe6080604052600436106100705760003560e01c8063a9e966b71161004e578063a9e966b7146100de578063ca8b8ad1146100fe578063cd330fb01461014a578063f465c77e1461016a57600080fd5b806310767904146100755780633a871cdd1461008a578063a9a23409146100bd575b600080fd5b61008861008336600461062e565b610198565b005b34801561009657600080fd5b506100aa6100a536600461065e565b6101f6565b6040519081526020015b60405180910390f35b3480156100c957600080fd5b506100886100d83660046106b2565b50505050565b3480156100ea57600080fd5b506100886100f9366004610741565b6102a0565b34801561010a57600080fd5b506101327f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016100b4565b34801561015657600080fd5b506100aa610165366004610770565b6102e1565b34801561017657600080fd5b5061018a61018536600461065e565b61045d565b6040516100b4929190610879565b604051621cb65b60e51b8152600160048201526001600160a01b03821690630396cb609034906024016000604051808303818588803b1580156101da57600080fd5b505af11580156101ee573d6000803e3d6000fd5b505050505050565b6000811561024a57604051600090339084908381818185875af1925050503d8060008114610240576040519150601f19603f3d011682016040523d82523d6000602084013e610245565b606091505b505050505b61029561025b61014086018661089b565b8080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152506102e192505050565b506000949350505050565b60005460408051918252602082018390527fe56f542cbdb0e18291d73ec9fd0b443112d0b4f547479e1303ffbc1007cc4f0f910160405180910390a1600055565b60408051808201909152600981526868616e646c654f707360b81b6020918201528151908201206000907fce204cb14db1456f3e271c1ead44898974871c52af46247d5d6e299a821c5d520361044e5760408051600080825260208201909252816103c0565b6103ad60405180610160016040528060006001600160a01b03168152602001600081526020016060815260200160608152602001600081526020016000815260200160008152602001600081526020016000815260200160608152602001606081525090565b8152602001906001900390816103475790505b506040516307eb652360e21b81529091506001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690631fad948c906104139084906001906004016108e9565b600060405180830381600087803b15801561042d57600080fd5b505af1158015610441573d6000803e3d6000fd5b5060009695505050505050565b610457826104df565b92915050565b606060008061047061012087018761089b565b61047e916014908290610a13565b8080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509293506104c192508391506102e19050565b50506040805160208101909152600080825290969095509350505050565b6040805160208082019092526000908190528251918301919091207fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4700361052857506000919050565b6040805180820190915260028152616f6b60f01b6020918201528251908301207f14502d3ab34ae28d404da8f6ec0501c6f295f66caa41e122cfa9b1291bc0f9e80361057657506000919050565b60408051808201909152600481526319985a5b60e21b6020918201528251908301207f3b2564d7e0fe091d49b4c20f4632191e4ed6986bf993849879abfef9465def25036105f75760405162461bcd60e51b81526020600482015260096024820152686661696c2072756c6560b81b60448201526064015b60405180910390fd5b816040516020016106089190610a3d565b60408051601f198184030181529082905262461bcd60e51b82526105ee91600401610a73565b60006020828403121561064057600080fd5b81356001600160a01b038116811461065757600080fd5b9392505050565b60008060006060848603121561067357600080fd5b833567ffffffffffffffff81111561068a57600080fd5b8401610160818703121561069d57600080fd5b95602085013595506040909401359392505050565b600080600080606085870312156106c857600080fd5b8435600381106106d757600080fd5b9350602085013567ffffffffffffffff808211156106f457600080fd5b818701915087601f83011261070857600080fd5b81358181111561071757600080fd5b88602082850101111561072957600080fd5b95986020929092019750949560400135945092505050565b60006020828403121561075357600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561078257600080fd5b813567ffffffffffffffff8082111561079a57600080fd5b818401915084601f8301126107ae57600080fd5b8135818111156107c0576107c061075a565b604051601f8201601f19908116603f011681019083821181831017156107e8576107e861075a565b8160405282815287602084870101111561080157600080fd5b826020860160208301376000928101602001929092525095945050505050565b60005b8381101561083c578181015183820152602001610824565b838111156100d85750506000910152565b60008151808452610865816020860160208601610821565b601f01601f19169290920160200192915050565b60408152600061088c604083018561084d565b90508260208301529392505050565b6000808335601e198436030181126108b257600080fd5b83018035915067ffffffffffffffff8211156108cd57600080fd5b6020019150368190038213156108e257600080fd5b9250929050565b60006040808301818452808651808352606092508286019150828160051b8701016020808a0160005b848110156109ed57898403605f19018652815180516001600160a01b03168552610160848201518587015289820151818b8801526109528288018261084d565b915050888201518682038a88015261096a828261084d565b6080848101519089015260a0808501519089015260c0808501519089015260e08085015190890152610100808501519089015261012080850151898303828b015291935091506109ba838261084d565b9250505061014080830151925086820381880152506109d9818361084d565b978501979550505090820190600101610912565b5050819650610a068189018a6001600160a01b03169052565b5050505050509392505050565b60008085851115610a2357600080fd5b83861115610a3057600080fd5b5050820193919092039150565b6d03ab735b737bbb710393ab6329d160951b815260008251610a6681600e850160208701610821565b91909101600e0192915050565b602081526000610657602083018461084d56fea26469706673582212209f8f7329b9269be187d5eb2a2e74129c8f246e1329892b03d196b451673579c264736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "_ep";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "oldState";
            readonly type: "uint256";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "newState";
            readonly type: "uint256";
        }];
        readonly name: "State";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "entryPoint";
            readonly type: "address";
        }];
        readonly name: "addStake";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "ep";
        readonly outputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "enum IPaymaster.PostOpMode";
            readonly name: "";
            readonly type: "uint8";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "postOp";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "string";
            readonly name: "rule";
            readonly type: "string";
        }];
        readonly name: "runRule";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_state";
            readonly type: "uint256";
        }];
        readonly name: "setState";
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
        readonly name: "validatePaymasterUserOp";
        readonly outputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "context";
            readonly type: "bytes";
        }, {
            readonly internalType: "uint256";
            readonly name: "deadline";
            readonly type: "uint256";
        }];
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
            readonly name: "missingAccountFunds";
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
    static createInterface(): TestRecursionAccountInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestRecursionAccount;
}
export {};
