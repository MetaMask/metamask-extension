import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { GetUserOpHashes, GetUserOpHashesInterface, UserOperationStruct } from "../../../contracts/BundlerHelper.sol/GetUserOpHashes";
type GetUserOpHashesConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class GetUserOpHashes__factory extends ContractFactory {
    constructor(...args: GetUserOpHashesConstructorParams);
    deploy(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<GetUserOpHashes>;
    getDeployTransaction(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): GetUserOpHashes;
    connect(signer: Signer): GetUserOpHashes__factory;
    static readonly bytecode = "0x60806040523480156200001157600080fd5b5060405162000675380380620006758339810160408190526200003491620002cd565b62000040828262000064565b604051628f37ad60e51b81526004016200005b9190620004be565b60405180910390fd5b606081516001600160401b038111156200008257620000826200019f565b604051908082528060200260200182016040528015620000ac578160200160208202803683370190505b50905060005b82518110156200017f57836001600160a01b031663a6193531848381518110620000e057620000e062000504565b60200260200101516040518263ffffffff1660e01b815260040162000106919062000548565b602060405180830381865afa15801562000124573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906200014a919062000632565b8282815181106200015f576200015f62000504565b60209081029190910101528062000176816200064c565b915050620000b2565b5092915050565b6001600160a01b03811681146200019c57600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60405161016081016001600160401b0381118282101715620001db57620001db6200019f565b60405290565b604051601f8201601f191681016001600160401b03811182821017156200020c576200020c6200019f565b604052919050565b8051620002218162000186565b919050565b60005b838110156200024357818101518382015260200162000229565b8381111562000253576000848401525b50505050565b600082601f8301126200026b57600080fd5b81516001600160401b038111156200028757620002876200019f565b6200029c601f8201601f1916602001620001e1565b818152846020838601011115620002b257600080fd5b620002c582602083016020870162000226565b949350505050565b60008060408385031215620002e157600080fd5b8251620002ee8162000186565b602084810151919350906001600160401b03808211156200030e57600080fd5b818601915086601f8301126200032357600080fd5b8151818111156200033857620003386200019f565b8060051b62000349858201620001e1565b918252838101850191858101908a8411156200036457600080fd5b86860192505b83831015620004ad578251858111156200038357600080fd5b8601610160818d03601f190112156200039b57600080fd5b620003a5620001b5565b620003b289830162000214565b8152604082015189820152606082015187811115620003d057600080fd5b620003e08e8b8386010162000259565b604083015250608082015187811115620003f957600080fd5b620004098e8b8386010162000259565b60608301525060a0820151608082015260c082015160a082015260e082015160c082015261010082015160e082015261012082015161010082015261014080830151888111156200045957600080fd5b620004698f8c8387010162000259565b61012084015250610160830151888111156200048457600080fd5b620004948f8c8387010162000259565b918301919091525083525091860191908601906200036a565b809750505050505050509250929050565b6020808252825182820181905260009190848201906040850190845b81811015620004f857835183529284019291840191600101620004da565b50909695505050505050565b634e487b7160e01b600052603260045260246000fd5b600081518084526200053481602086016020860162000226565b601f01601f19169290920160200192915050565b60208152620005636020820183516001600160a01b03169052565b60208201516040820152600060408301516101608060608501526200058d6101808501836200051a565b91506060850151601f1980868503016080870152620005ad84836200051a565b9350608087015160a087015260a087015160c087015260c087015160e087015260e087015191506101008281880152808801519250506101208281880152808801519250506101408187860301818801526200060a85846200051a565b9088015187820390920184880152935090506200062883826200051a565b9695505050505050565b6000602082840312156200064557600080fd5b5051919050565b6000600182016200066d57634e487b7160e01b600052601160045260246000fd5b506001019056fe";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "entryPoint";
            readonly type: "address";
        }, {
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
            readonly internalType: "struct UserOperation[]";
            readonly name: "userOps";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32[]";
            readonly name: "userOpHashes";
            readonly type: "bytes32[]";
        }];
        readonly name: "UserOpHashesResult";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "entryPoint";
            readonly type: "address";
        }, {
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
            readonly internalType: "struct UserOperation[]";
            readonly name: "userOps";
            readonly type: "tuple[]";
        }];
        readonly name: "getUserOpHashes";
        readonly outputs: readonly [{
            readonly internalType: "bytes32[]";
            readonly name: "ret";
            readonly type: "bytes32[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): GetUserOpHashesInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): GetUserOpHashes;
}
export {};
