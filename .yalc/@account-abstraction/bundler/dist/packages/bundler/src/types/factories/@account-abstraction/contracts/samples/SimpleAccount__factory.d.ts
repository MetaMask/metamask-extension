import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type { SimpleAccount, SimpleAccountInterface } from "../../../../@account-abstraction/contracts/samples/SimpleAccount";
type SimpleAccountConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class SimpleAccount__factory extends ContractFactory {
    constructor(...args: SimpleAccountConstructorParams);
    deploy(anEntryPoint: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<SimpleAccount>;
    getDeployTransaction(anEntryPoint: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): SimpleAccount;
    connect(signer: Signer): SimpleAccount__factory;
    static readonly bytecode = "0x60c0604052306080523480156200001557600080fd5b5060405162001d9138038062001d91833981016040819052620000389162000117565b6001600160a01b03811660a0526200004f62000056565b5062000149565b600054610100900460ff1615620000c35760405162461bcd60e51b815260206004820152602760248201527f496e697469616c697a61626c653a20636f6e747261637420697320696e697469604482015266616c697a696e6760c81b606482015260840160405180910390fd5b60005460ff9081161462000115576000805460ff191660ff9081179091556040519081527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b565b6000602082840312156200012a57600080fd5b81516001600160a01b03811681146200014257600080fd5b9392505050565b60805160a051611bd5620001bc600039600081816102c401528181610607015281816106880152818161090101528181610aab01528181610ae501528181610d620152610f5201526000818161050a0152818161054a015281816107190152818161075901526107ec0152611bd56000f3fe60806040526004361061010c5760003560e01c806352d1902d11610095578063bc197c8111610064578063bc197c8114610308578063c399ec8814610337578063c4d66de81461034c578063d087d2881461036c578063f23a6e611461038157600080fd5b806352d1902d146102625780638da5cb5b14610277578063b0d691fe146102b5578063b61d27f6146102e857600080fd5b80633659cfe6116100dc5780633659cfe6146101d95780633a871cdd146101f95780634a58db19146102275780634d44560d1461022f5780634f1ef2861461024f57600080fd5b806223de291461011857806301ffc9a71461013f578063150b7a021461017457806318dfb3c7146101b957600080fd5b3661011357005b600080fd5b34801561012457600080fd5b5061013d6101333660046114b2565b5050505050505050565b005b34801561014b57600080fd5b5061015f61015a366004611563565b6103ae565b60405190151581526020015b60405180910390f35b34801561018057600080fd5b506101a061018f36600461158d565b630a85bd0160e11b95945050505050565b6040516001600160e01b0319909116815260200161016b565b3480156101c557600080fd5b5061013d6101d4366004611645565b610400565b3480156101e557600080fd5b5061013d6101f43660046116b1565b610500565b34801561020557600080fd5b506102196102143660046116ce565b6105df565b60405190815260200161016b565b61013d610605565b34801561023b57600080fd5b5061013d61024a366004611722565b61067e565b61013d61025d366004611764565b61070f565b34801561026e57600080fd5b506102196107df565b34801561028357600080fd5b5060005461029d906201000090046001600160a01b031681565b6040516001600160a01b03909116815260200161016b565b3480156102c157600080fd5b507f000000000000000000000000000000000000000000000000000000000000000061029d565b3480156102f457600080fd5b5061013d610303366004611828565b610892565b34801561031457600080fd5b506101a0610323366004611878565b63bc197c8160e01b98975050505050505050565b34801561034357600080fd5b506102196108e1565b34801561035857600080fd5b5061013d6103673660046116b1565b610972565b34801561037857600080fd5b50610219610a84565b34801561038d57600080fd5b506101a061039c366004611916565b63f23a6e6160e01b9695505050505050565b60006001600160e01b03198216630a85bd0160e11b14806103df57506001600160e01b03198216630271189760e51b145b806103fa57506001600160e01b031982166301ffc9a760e01b145b92915050565b610408610ada565b8281146104525760405162461bcd60e51b815260206004820152601360248201527277726f6e67206172726179206c656e6774687360681b60448201526064015b60405180910390fd5b60005b838110156104f9576104e785858381811061047257610472611992565b905060200201602081019061048791906116b1565b600085858581811061049b5761049b611992565b90506020028101906104ad91906119a8565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610b6f92505050565b806104f1816119ef565b915050610455565b5050505050565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036105485760405162461bcd60e51b815260040161044990611a16565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610591600080516020611b59833981519152546001600160a01b031690565b6001600160a01b0316146105b75760405162461bcd60e51b815260040161044990611a62565b6105c081610bdf565b604080516000808252602082019092526105dc91839190610be7565b50565b60006105e9610d57565b6105f38484610dcf565b90506105fe82610e7b565b9392505050565b7f000000000000000000000000000000000000000000000000000000000000000060405163b760faf960e01b81523060048201526001600160a01b03919091169063b760faf99034906024016000604051808303818588803b15801561066a57600080fd5b505af11580156104f9573d6000803e3d6000fd5b610686610ec8565b7f000000000000000000000000000000000000000000000000000000000000000060405163040b850f60e31b81526001600160a01b03848116600483015260248201849052919091169063205c287890604401600060405180830381600087803b1580156106f357600080fd5b505af1158015610707573d6000803e3d6000fd5b505050505050565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036107575760405162461bcd60e51b815260040161044990611a16565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166107a0600080516020611b59833981519152546001600160a01b031690565b6001600160a01b0316146107c65760405162461bcd60e51b815260040161044990611a62565b6107cf82610bdf565b6107db82826001610be7565b5050565b6000306001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161461087f5760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610449565b50600080516020611b5983398151915290565b61089a610ada565b6108db848484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610b6f92505050565b50505050565b6040516370a0823160e01b81523060048201526000906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906370a08231906024015b602060405180830381865afa158015610949573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061096d9190611aae565b905090565b600054610100900460ff16158080156109925750600054600160ff909116105b806109ac5750303b1580156109ac575060005460ff166001145b610a0f5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b6064820152608401610449565b6000805460ff191660011790558015610a32576000805461ff0019166101001790555b610a3b82610f1f565b80156107db576000805461ff0019169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15050565b604051631aab3f0d60e11b8152306004820152600060248201819052906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906335567e1a9060440161092c565b336001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161480610b2157506000546201000090046001600160a01b031633145b610b6d5760405162461bcd60e51b815260206004820181905260248201527f6163636f756e743a206e6f74204f776e6572206f7220456e747279506f696e746044820152606401610449565b565b600080846001600160a01b03168484604051610b8b9190611af3565b60006040518083038185875af1925050503d8060008114610bc8576040519150601f19603f3d011682016040523d82523d6000602084013e610bcd565b606091505b5091509150816104f957805160208201fd5b6105dc610ec8565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615610c1f57610c1a83610f9b565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015610c79575060408051601f3d908101601f19168201909252610c7691810190611aae565b60015b610cdc5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b6064820152608401610449565b600080516020611b598339815191528114610d4b5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b6064820152608401610449565b50610c1a838383611037565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610b6d5760405162461bcd60e51b815260206004820152601c60248201527f6163636f756e743a206e6f742066726f6d20456e747279506f696e74000000006044820152606401610449565b7f19457468657265756d205369676e6564204d6573736167653a0a3332000000006000908152601c829052603c8120610e4c610e0f6101408601866119a8565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250859392505061105c9050565b6000546201000090046001600160a01b03908116911614610e715760019150506103fa565b5060009392505050565b80156105dc57604051600090339060001990849084818181858888f193505050503d80600081146104f9576040519150601f19603f3d011682016040523d82523d6000602084013e6104f9565b6000546201000090046001600160a01b0316331480610ee657503330145b610b6d5760405162461bcd60e51b815260206004820152600a60248201526937b7363c9037bbb732b960b11b6044820152606401610449565b6000805462010000600160b01b031916620100006001600160a01b038481168202929092178084556040519190048216927f0000000000000000000000000000000000000000000000000000000000000000909216917f47e55c76e7a6f1fd8996a1da8008c1ea29699cca35e7bcd057f2dec313b6e5de91a350565b6001600160a01b0381163b6110085760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b6064820152608401610449565b600080516020611b5983398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b61104083611080565b60008251118061104d5750805b15610c1a576108db83836110c0565b600080600061106b85856110e5565b915091506110788161112a565b509392505050565b61108981610f9b565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606105fe8383604051806060016040528060278152602001611b7960279139611274565b600080825160410361111b5760208301516040840151606085015160001a61110f878285856112ec565b94509450505050611123565b506000905060025b9250929050565b600081600481111561113e5761113e611b0f565b036111465750565b600181600481111561115a5761115a611b0f565b036111a75760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e617475726500000000000000006044820152606401610449565b60028160048111156111bb576111bb611b0f565b036112085760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e677468006044820152606401610449565b600381600481111561121c5761121c611b0f565b036105dc5760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b6064820152608401610449565b6060600080856001600160a01b0316856040516112919190611af3565b600060405180830381855af49150503d80600081146112cc576040519150601f19603f3d011682016040523d82523d6000602084013e6112d1565b606091505b50915091506112e2868383876113b0565b9695505050505050565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a083111561132357506000905060036113a7565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa158015611377573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166113a0576000600192509250506113a7565b9150600090505b94509492505050565b6060831561141f578251600003611418576001600160a01b0385163b6114185760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610449565b5081611429565b6114298383611431565b949350505050565b8151156114415781518083602001fd5b8060405162461bcd60e51b81526004016104499190611b25565b6001600160a01b03811681146105dc57600080fd5b60008083601f84011261148257600080fd5b50813567ffffffffffffffff81111561149a57600080fd5b60208301915083602082850101111561112357600080fd5b60008060008060008060008060c0898b0312156114ce57600080fd5b88356114d98161145b565b975060208901356114e98161145b565b965060408901356114f98161145b565b955060608901359450608089013567ffffffffffffffff8082111561151d57600080fd5b6115298c838d01611470565b909650945060a08b013591508082111561154257600080fd5b5061154f8b828c01611470565b999c989b5096995094979396929594505050565b60006020828403121561157557600080fd5b81356001600160e01b0319811681146105fe57600080fd5b6000806000806000608086880312156115a557600080fd5b85356115b08161145b565b945060208601356115c08161145b565b935060408601359250606086013567ffffffffffffffff8111156115e357600080fd5b6115ef88828901611470565b969995985093965092949392505050565b60008083601f84011261161257600080fd5b50813567ffffffffffffffff81111561162a57600080fd5b6020830191508360208260051b850101111561112357600080fd5b6000806000806040858703121561165b57600080fd5b843567ffffffffffffffff8082111561167357600080fd5b61167f88838901611600565b9096509450602087013591508082111561169857600080fd5b506116a587828801611600565b95989497509550505050565b6000602082840312156116c357600080fd5b81356105fe8161145b565b6000806000606084860312156116e357600080fd5b833567ffffffffffffffff8111156116fa57600080fd5b8401610160818703121561170d57600080fd5b95602085013595506040909401359392505050565b6000806040838503121561173557600080fd5b82356117408161145b565b946020939093013593505050565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561177757600080fd5b82356117828161145b565b9150602083013567ffffffffffffffff8082111561179f57600080fd5b818501915085601f8301126117b357600080fd5b8135818111156117c5576117c561174e565b604051601f8201601f19908116603f011681019083821181831017156117ed576117ed61174e565b8160405282815288602084870101111561180657600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b6000806000806060858703121561183e57600080fd5b84356118498161145b565b935060208501359250604085013567ffffffffffffffff81111561186c57600080fd5b6116a587828801611470565b60008060008060008060008060a0898b03121561189457600080fd5b883561189f8161145b565b975060208901356118af8161145b565b9650604089013567ffffffffffffffff808211156118cc57600080fd5b6118d88c838d01611600565b909850965060608b01359150808211156118f157600080fd5b6118fd8c838d01611600565b909650945060808b013591508082111561154257600080fd5b60008060008060008060a0878903121561192f57600080fd5b863561193a8161145b565b9550602087013561194a8161145b565b94506040870135935060608701359250608087013567ffffffffffffffff81111561197457600080fd5b61198089828a01611470565b979a9699509497509295939492505050565b634e487b7160e01b600052603260045260246000fd5b6000808335601e198436030181126119bf57600080fd5b83018035915067ffffffffffffffff8211156119da57600080fd5b60200191503681900382131561112357600080fd5b600060018201611a0f57634e487b7160e01b600052601160045260246000fd5b5060010190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b600060208284031215611ac057600080fd5b5051919050565b60005b83811015611ae2578181015183820152602001611aca565b838111156108db5750506000910152565b60008251611b05818460208701611ac7565b9190910192915050565b634e487b7160e01b600052602160045260246000fd5b6020815260008251806020840152611b44816040850160208701611ac7565b601f01601f1916919091016040019291505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220669547566f04697507cea93c87349db42ed424dc7c41a1a4e3b28755a7f0531864736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "anEntryPoint";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "previousAdmin";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "newAdmin";
            readonly type: "address";
        }];
        readonly name: "AdminChanged";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "beacon";
            readonly type: "address";
        }];
        readonly name: "BeaconUpgraded";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint8";
            readonly name: "version";
            readonly type: "uint8";
        }];
        readonly name: "Initialized";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "contract IEntryPoint";
            readonly name: "entryPoint";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }];
        readonly name: "SimpleAccountInitialized";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }];
        readonly name: "Upgraded";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "addDeposit";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "entryPoint";
        readonly outputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "dest";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "func";
            readonly type: "bytes";
        }];
        readonly name: "execute";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address[]";
            readonly name: "dest";
            readonly type: "address[]";
        }, {
            readonly internalType: "bytes[]";
            readonly name: "func";
            readonly type: "bytes[]";
        }];
        readonly name: "executeBatch";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getDeposit";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "getNonce";
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
            readonly name: "anOwner";
            readonly type: "address";
        }];
        readonly name: "initialize";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "uint256[]";
            readonly name: "";
            readonly type: "uint256[]";
        }, {
            readonly internalType: "uint256[]";
            readonly name: "";
            readonly type: "uint256[]";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }];
        readonly name: "onERC1155BatchReceived";
        readonly outputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "";
            readonly type: "bytes4";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }];
        readonly name: "onERC1155Received";
        readonly outputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "";
            readonly type: "bytes4";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }];
        readonly name: "onERC721Received";
        readonly outputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "";
            readonly type: "bytes4";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "owner";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "proxiableUUID";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "interfaceId";
            readonly type: "bytes4";
        }];
        readonly name: "supportsInterface";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes";
            readonly name: "";
            readonly type: "bytes";
        }];
        readonly name: "tokensReceived";
        readonly outputs: readonly [];
        readonly stateMutability: "pure";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newImplementation";
            readonly type: "address";
        }];
        readonly name: "upgradeTo";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newImplementation";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "upgradeToAndCall";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
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
            readonly name: "userOpHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint256";
            readonly name: "missingAccountFunds";
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
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address payable";
            readonly name: "withdrawAddress";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }];
        readonly name: "withdrawDepositTo";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly stateMutability: "payable";
        readonly type: "receive";
    }];
    static createInterface(): SimpleAccountInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): SimpleAccount;
}
export {};
