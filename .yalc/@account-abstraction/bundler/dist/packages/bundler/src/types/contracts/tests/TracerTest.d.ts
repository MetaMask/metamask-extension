import type { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export interface TracerTestInterface extends utils.Interface {
    functions: {
        "a()": FunctionFragment;
        "addr2int(address)": FunctionFragment;
        "b()": FunctionFragment;
        "callRevertingFunction(bool)": FunctionFragment;
        "callTimeStamp()": FunctionFragment;
        "callWithValue()": FunctionFragment;
        "doNothing()": FunctionFragment;
        "execSelf(bytes,bool)": FunctionFragment;
        "revertWithMessage()": FunctionFragment;
        "testCallGas()": FunctionFragment;
        "testKeccak(bytes)": FunctionFragment;
        "testStopTracing()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "a" | "addr2int" | "b" | "callRevertingFunction" | "callTimeStamp" | "callWithValue" | "doNothing" | "execSelf" | "revertWithMessage" | "testCallGas" | "testKeccak" | "testStopTracing"): FunctionFragment;
    encodeFunctionData(functionFragment: "a", values?: undefined): string;
    encodeFunctionData(functionFragment: "addr2int", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "b", values?: undefined): string;
    encodeFunctionData(functionFragment: "callRevertingFunction", values: [PromiseOrValue<boolean>]): string;
    encodeFunctionData(functionFragment: "callTimeStamp", values?: undefined): string;
    encodeFunctionData(functionFragment: "callWithValue", values?: undefined): string;
    encodeFunctionData(functionFragment: "doNothing", values?: undefined): string;
    encodeFunctionData(functionFragment: "execSelf", values: [PromiseOrValue<BytesLike>, PromiseOrValue<boolean>]): string;
    encodeFunctionData(functionFragment: "revertWithMessage", values?: undefined): string;
    encodeFunctionData(functionFragment: "testCallGas", values?: undefined): string;
    encodeFunctionData(functionFragment: "testKeccak", values: [PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "testStopTracing", values?: undefined): string;
    decodeFunctionResult(functionFragment: "a", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addr2int", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "b", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callRevertingFunction", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callTimeStamp", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "callWithValue", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "doNothing", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "execSelf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "revertWithMessage", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "testCallGas", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "testKeccak", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "testStopTracing", data: BytesLike): Result;
    events: {
        "BeforeExecution()": EventFragment;
        "ExecSelfResult(bytes,bool,bytes)": EventFragment;
        "Keccak(bytes,bytes32)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "BeforeExecution"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "ExecSelfResult"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Keccak"): EventFragment;
}
export interface BeforeExecutionEventObject {
}
export type BeforeExecutionEvent = TypedEvent<[], BeforeExecutionEventObject>;
export type BeforeExecutionEventFilter = TypedEventFilter<BeforeExecutionEvent>;
export interface ExecSelfResultEventObject {
    data: string;
    success: boolean;
    result: string;
}
export type ExecSelfResultEvent = TypedEvent<[
    string,
    boolean,
    string
], ExecSelfResultEventObject>;
export type ExecSelfResultEventFilter = TypedEventFilter<ExecSelfResultEvent>;
export interface KeccakEventObject {
    input: string;
    output: string;
}
export type KeccakEvent = TypedEvent<[string, string], KeccakEventObject>;
export type KeccakEventFilter = TypedEventFilter<KeccakEvent>;
export interface TracerTest extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TracerTestInterface;
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
        a(overrides?: CallOverrides): Promise<[BigNumber]>;
        addr2int(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber]>;
        b(overrides?: CallOverrides): Promise<[BigNumber]>;
        callRevertingFunction(oog: PromiseOrValue<boolean>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        callTimeStamp(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        callWithValue(overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        doNothing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        execSelf(data: PromiseOrValue<BytesLike>, useNumber: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        revertWithMessage(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        testCallGas(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        testKeccak(asd: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        testStopTracing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
    };
    a(overrides?: CallOverrides): Promise<BigNumber>;
    addr2int(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    b(overrides?: CallOverrides): Promise<BigNumber>;
    callRevertingFunction(oog: PromiseOrValue<boolean>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callTimeStamp(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callWithValue(overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    doNothing(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    execSelf(data: PromiseOrValue<BytesLike>, useNumber: PromiseOrValue<boolean>, overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    revertWithMessage(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    testCallGas(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    testKeccak(asd: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    testStopTracing(overrides?: Overrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        a(overrides?: CallOverrides): Promise<BigNumber>;
        addr2int(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        b(overrides?: CallOverrides): Promise<BigNumber>;
        callRevertingFunction(oog: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<void>;
        callTimeStamp(overrides?: CallOverrides): Promise<BigNumber>;
        callWithValue(overrides?: CallOverrides): Promise<BigNumber>;
        doNothing(overrides?: CallOverrides): Promise<void>;
        execSelf(data: PromiseOrValue<BytesLike>, useNumber: PromiseOrValue<boolean>, overrides?: CallOverrides): Promise<BigNumber>;
        revertWithMessage(overrides?: CallOverrides): Promise<void>;
        testCallGas(overrides?: CallOverrides): Promise<BigNumber>;
        testKeccak(asd: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<string>;
        testStopTracing(overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "BeforeExecution()"(): BeforeExecutionEventFilter;
        BeforeExecution(): BeforeExecutionEventFilter;
        "ExecSelfResult(bytes,bool,bytes)"(data?: null, success?: null, result?: null): ExecSelfResultEventFilter;
        ExecSelfResult(data?: null, success?: null, result?: null): ExecSelfResultEventFilter;
        "Keccak(bytes,bytes32)"(input?: null, output?: null): KeccakEventFilter;
        Keccak(input?: null, output?: null): KeccakEventFilter;
    };
    estimateGas: {
        a(overrides?: CallOverrides): Promise<BigNumber>;
        addr2int(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        b(overrides?: CallOverrides): Promise<BigNumber>;
        callRevertingFunction(oog: PromiseOrValue<boolean>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        callTimeStamp(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        callWithValue(overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        doNothing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        execSelf(data: PromiseOrValue<BytesLike>, useNumber: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        revertWithMessage(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        testCallGas(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        testKeccak(asd: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        testStopTracing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        a(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        addr2int(arg0: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        b(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        callRevertingFunction(oog: PromiseOrValue<boolean>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        callTimeStamp(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        callWithValue(overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        doNothing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        execSelf(data: PromiseOrValue<BytesLike>, useNumber: PromiseOrValue<boolean>, overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        revertWithMessage(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        testCallGas(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        testKeccak(asd: PromiseOrValue<BytesLike>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        testStopTracing(overrides?: Overrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
    };
}
