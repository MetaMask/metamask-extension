import type { BaseContract, BigNumber, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "../../../../common";
export interface IERC1822ProxiableInterface extends utils.Interface {
    functions: {
        "proxiableUUID()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "proxiableUUID"): FunctionFragment;
    encodeFunctionData(functionFragment: "proxiableUUID", values?: undefined): string;
    decodeFunctionResult(functionFragment: "proxiableUUID", data: BytesLike): Result;
    events: {};
}
export interface IERC1822Proxiable extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IERC1822ProxiableInterface;
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
        proxiableUUID(overrides?: CallOverrides): Promise<[string]>;
    };
    proxiableUUID(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        proxiableUUID(overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        proxiableUUID(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        proxiableUUID(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
