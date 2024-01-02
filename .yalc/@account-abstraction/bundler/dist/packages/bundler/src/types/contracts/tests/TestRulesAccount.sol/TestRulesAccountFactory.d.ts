import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../../common";
export interface TestRulesAccountFactoryInterface extends utils.Interface {
    functions: {
        "coin()": FunctionFragment;
        "create(string)": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "coin" | "create"): FunctionFragment;
    encodeFunctionData(functionFragment: "coin", values?: undefined): string;
    encodeFunctionData(functionFragment: "create", values: [PromiseOrValue<string>]): string;
    decodeFunctionResult(functionFragment: "coin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "create", data: BytesLike): Result;
    events: {};
}
export interface TestRulesAccountFactory extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TestRulesAccountFactoryInterface;
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
        coin(overrides?: CallOverrides): Promise<[string]>;
        create(rule: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    coin(overrides?: CallOverrides): Promise<string>;
    create(rule: PromiseOrValue<string>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        coin(overrides?: CallOverrides): Promise<string>;
        create(rule: PromiseOrValue<string>, overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        coin(overrides?: CallOverrides): Promise<BigNumber>;
        create(rule: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        coin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        create(rule: PromiseOrValue<string>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
