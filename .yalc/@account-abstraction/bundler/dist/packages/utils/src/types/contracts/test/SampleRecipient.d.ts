import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export interface SampleRecipientInterface extends utils.Interface {
    functions: {
        "reverting()": FunctionFragment;
        "something(string)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "reverting" | "something"): FunctionFragment;
    encodeFunctionData(functionFragment: "reverting", values?: undefined): string;
    encodeFunctionData(functionFragment: "something", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "reverting", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "something", data: BytesLike): Result;
    events: {
        "Sender(address,address,string)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Sender"): EventFragment;
}
export interface SenderEventObject {
    txOrigin: string;
    msgSender: string;
    message: string;
}
export type SenderEvent = TypedEvent<[
    string,
    string,
    string
], SenderEventObject>;
export type SenderEventFilter = TypedEventFilter<SenderEvent>;
export interface SampleRecipient extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: SampleRecipientInterface;
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
        reverting(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        something(message: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    reverting(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    something(message: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        reverting(overrides?: CallOverrides): Promise<void>;
        something(message: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "Sender(address,address,string)"(txOrigin?: null, msgSender?: null, message?: null): SenderEventFilter;
        Sender(txOrigin?: null, msgSender?: null, message?: null): SenderEventFilter;
    };
    estimateGas: {
        reverting(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        something(message: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        reverting(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        something(message: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
