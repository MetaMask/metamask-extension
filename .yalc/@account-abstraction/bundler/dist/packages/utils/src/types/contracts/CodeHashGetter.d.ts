import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../common";
export interface CodeHashGetterInterface extends utils.Interface {
    functions: {
        "getCodeHashes(address[])": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "getCodeHashes"): FunctionFragment;
    encodeFunctionData(functionFragment: "getCodeHashes", values: [PromiseOrValue<string>[]]): string;
    decodeFunctionResult(functionFragment: "getCodeHashes", data: BytesLike): Result;
    events: {};
}
export interface CodeHashGetter extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: CodeHashGetterInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        getCodeHashes(addresses: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<[string]>;
    };
    getCodeHashes(addresses: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<string>;
    callStatic: {
        getCodeHashes(addresses: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        getCodeHashes(addresses: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        getCodeHashes(addresses: PromiseOrValue<string>[], overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
