import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type { SampleRecipient, SampleRecipientInterface } from "../../../../src/contracts/test/SampleRecipient";
type SampleRecipientConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class SampleRecipient__factory extends ContractFactory {
    constructor(...args: SampleRecipientConstructorParams);
    deploy(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<SampleRecipient>;
    getDeployTransaction(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): TransactionRequest;
    attach(address: string): SampleRecipient;
    connect(signer: Signer): SampleRecipient__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b5061023e806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806325d9185c1461003b578063d1f9cf0e14610045575b600080fd5b610043610058565b005b6100436100533660046100e6565b610092565b60405162461bcd60e51b815260206004820152600b60248201526a1d195cdd081c995d995c9d60aa1b604482015260640160405180910390fd5b7f603c3fe9b00ecddbd86daa6cbfe9a7f26505792913b8d1dec79052d86b5f79df3233836040516100c593929190610197565b60405180910390a150565b634e487b7160e01b600052604160045260246000fd5b6000602082840312156100f857600080fd5b813567ffffffffffffffff8082111561011057600080fd5b818401915084601f83011261012457600080fd5b813581811115610136576101366100d0565b604051601f8201601f19908116603f0116810190838211818310171561015e5761015e6100d0565b8160405282815287602084870101111561017757600080fd5b826020860160208301376000928101602001929092525095945050505050565b600060018060a01b038086168352602081861681850152606060408501528451915081606085015260005b828110156101de578581018201518582016080015281016101c2565b828111156101f0576000608084870101525b5050601f01601f19169190910160800194935050505056fea2646970667358221220698f660ce7ebea7394637b8f2d2d03cfe65f1ec5d13e7aa23c8dff2a6a3a55a364736f6c634300080f0033";
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "txOrigin";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "msgSender";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "message";
            readonly type: "string";
        }];
        readonly name: "Sender";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "reverting";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "string";
            readonly name: "message";
            readonly type: "string";
        }];
        readonly name: "something";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): SampleRecipientInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): SampleRecipient;
}
export {};
