import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "../../../common";
export interface DummyInterface extends utils.Interface {
    functions: {
        "value()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "value"): FunctionFragment;
    encodeFunctionData(functionFragment: "value", values?: undefined): string;
    decodeFunctionResult(functionFragment: "value", data: BytesLike): Result;
    events: {};
}
export interface Dummy extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: DummyInterface;
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
        value(overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    value(overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        value(overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {};
    estimateGas: {
        value(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        value(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
