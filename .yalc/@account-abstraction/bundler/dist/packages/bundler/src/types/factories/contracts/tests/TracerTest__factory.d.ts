import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { TracerTest, TracerTestInterface } from "../../../contracts/tests/TracerTest";
type TracerTestConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class TracerTest__factory extends ContractFactory {
    constructor(...args: TracerTestConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<TracerTest>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): TracerTest;
    connect(signer: Signer): TracerTest__factory;
    static readonly bytecode = "0x6080604052601460015534801561001557600080fd5b50610865806100256000396000f3fe6080604052600436106100a75760003560e01c80634b2a9ffb116100645780634b2a9ffb1461014c5780634df7e3d0146101615780639779872514610177578063c3cefd361461018a578063de553ae914610192578063e041663a146101a557600080fd5b8063032e7a48146100ac5780630dbe671f146100c3578063185c38a4146100eb578063288ebed0146101005780632f576f201461012d57806343f2b0cb14610139575b600080fd5b3480156100b857600080fd5b506100c16101c5565b005b3480156100cf57600080fd5b506100d960005481565b60405190815260200160405180910390f35b3480156100f757600080fd5b506100c161031f565b34801561010c57600080fd5b506100d961011b366004610578565b60026020526000908152604090205481565b3480156100c157600080fd5b34801561014557600080fd5b50426100d9565b34801561015857600080fd5b506100d961035c565b34801561016d57600080fd5b506100d960015481565b6100d96101853660046105be565b610364565b6100d96103aa565b6100c16101a0366004610684565b610444565b3480156101b157600080fd5b506100d96101c036600461069f565b6104ad565b306001600160a01b03166343f2b0cb6040518163ffffffff1660e01b81526004016020604051808303816000875af1158015610205573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102299190610720565b50306001600160a01b03166343f2b0cb6040518163ffffffff1660e01b81526004016020604051808303816000875af115801561026a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061028e9190610720565b506040517fbb47ee3e183a558b1a2ff0874b079f3fc5478b7454eacf2bfc5af2ff5878f97290600090a1306001600160a01b03166343f2b0cb6040518163ffffffff1660e01b81526004016020604051808303816000875af11580156102f8573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061031c9190610720565b50565b60405162461bcd60e51b815260206004820152600e60248201526d726576657274206d65737361676560901b604482015260640160405180910390fd5b60005a905090565b805160208201206040517f40474c452de0c0e16b7b95c83976848c6800a5a8b7a325bc6fbcad041829da749061039d9084908490610786565b60405180910390a1919050565b60156000908155604051639779872560e01b8152602060048201526005602482015264656d70747960d81b60448201523090639779872590349060640160206040518083038185885af1158015610405573d6000803e3d6000fd5b50505050506040513d601f19601f8201168201806040525081019061042a9190610720565b505060015433600090815260026020526040902081905590565b60005a9050811561045457506101f45b306001600160a01b031663185c38a4826040518263ffffffff1660e01b8152600401600060405180830381600088803b15801561049057600080fd5b5087f11580156104a4573d6000803e3d6000fd5b50505050505050565b60008082156104b95750435b600080306001600160a01b031687876040516104d69291906107a8565b6000604051808303816000865af19150503d8060008114610513576040519150601f19603f3d011682016040523d82523d6000602084013e610518565b606091505b509150915084156105305761052d43846107b8565b92505b7f63e0bc753f6799d2d8cfc5cd409922fba46c1431270aae9232c19d64a76b82848787848460405161056594939291906107de565b60405180910390a1509095945050505050565b60006020828403121561058a57600080fd5b81356001600160a01b03811681146105a157600080fd5b9392505050565b634e487b7160e01b600052604160045260246000fd5b6000602082840312156105d057600080fd5b813567ffffffffffffffff808211156105e857600080fd5b818401915084601f8301126105fc57600080fd5b81358181111561060e5761060e6105a8565b604051601f8201601f19908116603f01168101908382118183101715610636576106366105a8565b8160405282815287602084870101111561064f57600080fd5b826020860160208301376000928101602001929092525095945050505050565b8035801515811461067f57600080fd5b919050565b60006020828403121561069657600080fd5b6105a18261066f565b6000806000604084860312156106b457600080fd5b833567ffffffffffffffff808211156106cc57600080fd5b818601915086601f8301126106e057600080fd5b8135818111156106ef57600080fd5b87602082850101111561070157600080fd5b602092830195509350610717918601905061066f565b90509250925092565b60006020828403121561073257600080fd5b5051919050565b6000815180845260005b8181101561075f57602081850181015186830182015201610743565b81811115610771576000602083870101525b50601f01601f19169290920160200192915050565b6040815260006107996040830185610739565b90508260208301529392505050565b8183823760009101908152919050565b600082198211156107d957634e487b7160e01b600052601160045260246000fd5b500190565b60608152836060820152838560808301376000608085830101526000601f19601f8601168201841515602084015260808382030160408401526108246080820185610739565b97965050505050505056fea2646970667358221220e1ca4efcd6a1f4434feed40bf4195f8d2935abce303402ce1a1c4aa6cd35942164736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [];
        readonly name: "BeforeExecution";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }, {
            readonly indexed: false;
            readonly internalType: "bool";
            readonly name: "success";
            readonly type: "bool";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "result";
            readonly type: "bytes";
        }];
        readonly name: "ExecSelfResult";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "input";
            readonly type: "bytes";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes32";
            readonly name: "output";
            readonly type: "bytes32";
        }];
        readonly name: "Keccak";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "a";
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
            readonly name: "";
            readonly type: "address";
        }];
        readonly name: "addr2int";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "b";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bool";
            readonly name: "oog";
            readonly type: "bool";
        }];
        readonly name: "callRevertingFunction";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "callTimeStamp";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "callWithValue";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "doNothing";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }, {
            readonly internalType: "bool";
            readonly name: "useNumber";
            readonly type: "bool";
        }];
        readonly name: "execSelf";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "revertWithMessage";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "testCallGas";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "asd";
            readonly type: "bytes";
        }];
        readonly name: "testKeccak";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "ret";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "testStopTracing";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): TracerTestInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): TracerTest;
}
export {};
