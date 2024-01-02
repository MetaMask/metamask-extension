import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { CodeHashGetter, CodeHashGetterInterface } from "../../contracts/CodeHashGetter";
type CodeHashGetterConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class CodeHashGetter__factory extends ContractFactory {
    constructor(...args: CodeHashGetterConstructorParams);
    deploy(addresses: PromiseOrValue<string>[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<CodeHashGetter>;
    getDeployTransaction(addresses: PromiseOrValue<string>[], overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): CodeHashGetter;
    connect(signer: Signer): CodeHashGetter__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b506040516102b03803806102b083398101604081905261002f9161016a565b6100388161005d565b60405163091cd00560e01b815260040161005491815260200190565b60405180910390fd5b60008082516001600160401b0381111561007957610079610138565b6040519080825280602002602001820160405280156100a2578160200160208202803683370190505b50905060005b8351811015610104578381815181106100c3576100c361022e565b60200260200101516001600160a01b03163f8282815181106100e7576100e761022e565b6020908102919091010152806100fc81610244565b9150506100a8565b50600081604051602001610118919061026b565b60408051601f198184030181529190528051602090910120949350505050565b634e487b7160e01b600052604160045260246000fd5b80516001600160a01b038116811461016557600080fd5b919050565b6000602080838503121561017d57600080fd5b82516001600160401b038082111561019457600080fd5b818501915085601f8301126101a857600080fd5b8151818111156101ba576101ba610138565b8060051b604051601f19603f830116810181811085821117156101df576101df610138565b6040529182528482019250838101850191888311156101fd57600080fd5b938501935b82851015610222576102138561014e565b84529385019392850192610202565b98975050505050505050565b634e487b7160e01b600052603260045260246000fd5b60006001820161026457634e487b7160e01b600052601160045260246000fd5b5060010190565b6020808252825182820181905260009190848201906040850190845b818110156102a357835183529284019291840191600101610287565b5090969550505050505056fe";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address[]";
            readonly name: "addresses";
            readonly type: "address[]";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "hash";
            readonly type: "bytes32";
        }];
        readonly name: "CodeHashesResult";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address[]";
            readonly name: "addresses";
            readonly type: "address[]";
        }];
        readonly name: "getCodeHashes";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): CodeHashGetterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): CodeHashGetter;
}
export {};
