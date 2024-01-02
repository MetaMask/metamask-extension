import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "../../../../common";
export interface IBeaconInterface extends utils.Interface {
    functions: {
        "implementation()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "implementation"): FunctionFragment;
    encodeFunctionData(functionFragment: "implementation", values?: undefined): string;
    decodeFunctionResult(functionFragment: "implementation", data: BytesLike): Result;
    events: {};
}
export interface IBeacon extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IBeaconInterface;
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
        implementation(overrides?: CallOverrides): Promise<[string]>;
    };
    implementation(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        implementation(overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        implementation(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        implementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
