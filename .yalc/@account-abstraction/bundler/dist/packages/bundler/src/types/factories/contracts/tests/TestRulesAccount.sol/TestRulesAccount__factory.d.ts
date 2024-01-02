import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type { TestRulesAccount, TestRulesAccountInterface } from "../../../../contracts/tests/TestRulesAccount.sol/TestRulesAccount";
type TestRulesAccountConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TestRulesAccount__factory extends ContractFactory {
    constructor(...args: TestRulesAccountConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TestRulesAccount>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TestRulesAccount;
    connect(signer: Signer): TestRulesAccount__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506110ed806100206000396000f3fe6080604052600436106100865760003560e01c8063a9a2340911610059578063a9a234091461014b578063a9e966b71461016c578063cd330fb01461018c578063e3480cb3146101ac578063f465c77e146101c157600080fd5b8063107679041461008b57806311df9995146100a05780633a871cdd146100dd57806382e46b751461010b575b600080fd5b61009e610099366004610c57565b6101ef565b005b3480156100ac57600080fd5b506001546100c0906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100e957600080fd5b506100fd6100f8366004610c74565b61024d565b6040519081526020016100d4565b34801561011757600080fd5b506100fd610126366004610c57565b600180546001600160a01b0319166001600160a01b0392909216919091179055600090565b34801561015757600080fd5b5061009e610166366004610cc8565b50505050565b34801561017857600080fd5b5061009e610187366004610d57565b610335565b34801561019857600080fd5b506100fd6101a7366004610d86565b610376565b3480156101b857600080fd5b5061009e610b86565b3480156101cd57600080fd5b506101e16101dc366004610c74565b610bb1565b6040516100d4929190610e8f565b604051621cb65b60e51b8152600160048201526001600160a01b03821690630396cb609034906024016000604051808303818588803b15801561023157600080fd5b505af1158015610245573d6000803e3d6000fd5b505050505050565b600081156102a157604051600090339084908381818185875af1925050503d8060008114610297576040519150601f19603f3d011682016040523d82523d6000602084013e61029c565b606091505b505050505b6102af610140850185610eb1565b90506004036102dd5760006102c8610140860186610eb1565b6102d191610eff565b60e01c915061032e9050565b6103286102ee610140860186610eb1565b8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061037692505050565b50600090505b9392505050565b60005460408051918252602082018390527fe56f542cbdb0e18291d73ec9fd0b443112d0b4f547479e1303ffbc1007cc4f0f910160405180910390a1600055565b6040805160208082019092526000908190528251918301919091207fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470036103bf57506000919050565b604080518082019091526006815265373ab6b132b960d11b6020918201528251908301207ff648814c67221440671fd7c2de979db4020a9320fb7985ff79ca8e7dced277f803610410575043919050565b604080518082019091526008815267636f696e6261736560c01b6020918201528251908301207f76ec948a9207fdea26dcba91086bcdd181920ff52a539b0d1eb28e73b4cd92af03610463575041919050565b6040805180820190915260098152680c4d8dec6d6d0c2e6d60bb1b6020918201528251908301207fd60ee5d9b1a312631632d0ab8816ca64259093d8ab0b4d29f35db6a6151b0f8d036104b857505060004090565b60408051808201909152600781526631b932b0ba329960c91b6020918201528251908301207f8fac3d089893f1e87120aee7f9c091bedb61facca5e493da02330bcb46f0949c0361059a5760405160019061051290610c33565b8190604051809103906000f5905080158015610532573d6000803e3d6000fd5b506001600160a01b0316633fa4f2456040518163ffffffff1660e01b8152600401602060405180830381865afa158015610570573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105949190610f2f565b92915050565b60408051808201909152600c81526b3130b630b731b296b9b2b63360a11b6020918201528251908301207fe1eb40348c4d42c6f93b840cbedec69afb249b96fd8af4bcbeed87fcef3815d803610633576001546040516370a0823160e01b81523060048201526001600160a01b03909116906370a08231906024015b602060405180830381865afa158015610570573d6000803e3d6000fd5b60408051808201909152601081526f616c6c6f77616e63652d73656c662d3160801b6020918201528251908301207fcc3befdbd4c845f2f5f48ac59e621de2a47c26950d22d6092b4c2ffafdfc7f9f036106be5760018054604051636eb1769f60e11b815230600482015260248101929092526001600160a01b03169063dd62ed3e90604401610616565b60408051808201909152601081526f30b63637bbb0b731b2969896b9b2b63360811b6020918201528251908301207f46b549298973374f07ae868394b73f37c1cf6f25e976e36f99f1abbe6a5284e6036107495760018054604051636eb1769f60e11b815260048101929092523060248301526001600160a01b03169063dd62ed3e90604401610616565b60408051808201909152600981526836b4b73a16b9b2b63360b91b6020918201528251908301207f39509d2173ec8a4262a15fa569ebaeed05ddef813417dbd2877e415703355b6e036107e1576001546040516335313c2160e11b81523060048201526001600160a01b0390911690636a627842906024015b6020604051808303816000875af1158015610570573d6000803e3d6000fd5b60408051808201909152600981526862616c616e63652d3160b81b6020918201528251908301207f48bf62c98ebd199a8c4fa7e17d20fdbda06a014deb397741460366ff7e1e07550361085f57600180546040516370a0823160e01b815260048101929092526001600160a01b0316906370a0823190602401610616565b6040805180820190915260068152656d696e742d3160d01b6020918201528251908301207ff794573481a09002e3e46f42daa5499159620e2a2cc3f5bdd26c0a2669544d93036108da57600180546040516335313c2160e11b815260048101929092526001600160a01b031690636a627842906024016107c2565b60408051808201909152600b81526a39ba393ab1ba16b9b2b63360a91b6020918201528251908301207e05e75ff00cb9bce888bba342b06e4b9d4695ba7caf0afdef7ef8cf6735bb7d036109a45760015460405160016222a30f60e01b031981523060048201526001600160a01b039091169063ffdd5cf1906024015b6060604051808303816000875af1158015610976573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061099a9190610f48565b6040015192915050565b6040805180820190915260088152677374727563742d3160c01b6020918201528251908301207f416c09f102f2ef6799166d01fa870b6995b38e93784afdbdda0c68b94ab7eadd03610a24576001805460405160016222a30f60e01b0319815260048101929092526001600160a01b03169063ffdd5cf190602401610957565b60408051808201909152600c81526b1a5b9b995c8b5c995d995c9d60a21b6020918201528251908301207fc78ed5b2fc828eecd2c4fb3d39653e18c93b7d1815a5571aa088439dec36211a03610ac957600160009054906101000a90046001600160a01b03166001600160a01b03166325d9185c6040518163ffffffff1660e01b81526004016020604051808303816000875af1158015610570573d6000803e3d6000fd5b604080518082019091526008815267656d69742d6d736760c01b6020918201528251908301207f9b68a4beda047bbcff1923196e9af52348c30a06718efbeffa6d1dcc2c0a40fe03610b46576040517f9290a3722c5472b1809a59826d75e07853b4fb2f836d93a3adee7b819ab8eac390600090a1506000919050565b81604051602001610b579190610fa4565b60408051601f198184030181529082905262461bcd60e51b8252610b7d91600401610fda565b60405180910390fd5b6040517fd854278016dc3ac42aef8d423d936f9f37eea6f9a640f8a189f44247f1282c2c90600090a1565b6060600080610bc4610120870187610eb1565b610bd2916014908290610fed565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929350610c1592508391506103769050565b50506040805160208101909152600080825290969095509350505050565b60a08061101883390190565b6001600160a01b0381168114610c5457600080fd5b50565b600060208284031215610c6957600080fd5b813561032e81610c3f565b600080600060608486031215610c8957600080fd5b833567ffffffffffffffff811115610ca057600080fd5b84016101608187031215610cb357600080fd5b95602085013595506040909401359392505050565b60008060008060608587031215610cde57600080fd5b843560038110610ced57600080fd5b9350602085013567ffffffffffffffff80821115610d0a57600080fd5b818701915087601f830112610d1e57600080fd5b813581811115610d2d57600080fd5b886020828501011115610d3f57600080fd5b95986020929092019750949560400135945092505050565b600060208284031215610d6957600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b600060208284031215610d9857600080fd5b813567ffffffffffffffff80821115610db057600080fd5b818401915084601f830112610dc457600080fd5b813581811115610dd657610dd6610d70565b604051601f8201601f19908116603f01168101908382118183101715610dfe57610dfe610d70565b81604052828152876020848701011115610e1757600080fd5b826020860160208301376000928101602001929092525095945050505050565b60005b83811015610e52578181015183820152602001610e3a565b838111156101665750506000910152565b60008151808452610e7b816020860160208601610e37565b601f01601f19169290920160200192915050565b604081526000610ea26040830185610e63565b90508260208301529392505050565b6000808335601e19843603018112610ec857600080fd5b83018035915067ffffffffffffffff821115610ee357600080fd5b602001915036819003821315610ef857600080fd5b9250929050565b6001600160e01b03198135818116916004851015610f275780818660040360031b1b83161692505b505092915050565b600060208284031215610f4157600080fd5b5051919050565b600060608284031215610f5a57600080fd5b6040516060810181811067ffffffffffffffff82111715610f7d57610f7d610d70565b80604052508251815260208301516020820152604083015160408201528091505092915050565b6d03ab735b737bbb710393ab6329d160951b815260008251610fcd81600e850160208701610e37565b91909101600e0192915050565b60208152600061032e6020830184610e63565b60008085851115610ffd57600080fd5b8386111561100a57600080fd5b505082019391909203915056fe60806040526001600055348015601457600080fd5b50607d806100236000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b603560005481565b60405190815260200160405180910390f3fea2646970667358221220b77ea53a9a9bcbe47f84617775b87efd2486d2c872ea6932cddce711744246eb64736f6c634300080f0033a2646970667358221220197c1b7d1ce5b2b1442795ef13b3c55a9e4f14bf024469990d2952c5826c675264736f6c634300080f0033";
    static readonly abi: readonly [{
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
        readonly anonymous: false;
        readonly inputs: readonly [];
        readonly name: "TestFromValidation";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [];
        readonly name: "TestMessage";
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
        readonly name: "coin";
        readonly outputs: readonly [{
            readonly internalType: "contract TestCoin";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "execSendMessage";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
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
            readonly internalType: "contract TestCoin";
            readonly name: "_coin";
            readonly type: "address";
        }];
        readonly name: "setCoin";
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
    static createInterface(): TestRulesAccountInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TestRulesAccount;
}
export {};
