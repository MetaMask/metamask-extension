import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../../common";
export type UserOperationStruct = {
    sender: PromiseOrValue<string>;
    nonce: PromiseOrValue<BigNumberish>;
    initCode: PromiseOrValue<BytesLike>;
    callData: PromiseOrValue<BytesLike>;
    callGasLimit: PromiseOrValue<BigNumberish>;
    verificationGasLimit: PromiseOrValue<BigNumberish>;
    preVerificationGas: PromiseOrValue<BigNumberish>;
    maxFeePerGas: PromiseOrValue<BigNumberish>;
    maxPriorityFeePerGas: PromiseOrValue<BigNumberish>;
    paymasterAndData: PromiseOrValue<BytesLike>;
    signature: PromiseOrValue<BytesLike>;
};
export type UserOperationStructOutput = [
    string,
    BigNumber,
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    string
] & {
    sender: string;
    nonce: BigNumber;
    initCode: string;
    callData: string;
    callGasLimit: BigNumber;
    verificationGasLimit: BigNumber;
    preVerificationGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
    paymasterAndData: string;
    signature: string;
};
export interface IAggregatorInterface extends utils.Interface {
    functions: {
        "aggregateSignatures((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])": FunctionFragment;
        "validateSignatures((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],bytes)": FunctionFragment;
        "validateUserOpSignature((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes))": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "aggregateSignatures" | "validateSignatures" | "validateUserOpSignature"): FunctionFragment;
    encodeFunctionData(functionFragment: "aggregateSignatures", values: [UserOperationStruct[]]): string;
    encodeFunctionData(functionFragment: "validateSignatures", values: [UserOperationStruct[], PromiseOrValue<BytesLike>]): string;
    encodeFunctionData(functionFragment: "validateUserOpSignature", values: [UserOperationStruct]): string;
    decodeFunctionResult(functionFragment: "aggregateSignatures", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "validateSignatures", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "validateUserOpSignature", data: BytesLike): Result;
    events: {};
}
export interface IAggregator extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: IAggregatorInterface;
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
        aggregateSignatures(userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<[string] & {
            aggregatedSignature: string;
        }>;
        validateSignatures(userOps: UserOperationStruct[], signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<[void]>;
        validateUserOpSignature(userOp: UserOperationStruct, overrides?: CallOverrides): Promise<[string] & {
            sigForUserOp: string;
        }>;
    };
    aggregateSignatures(userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<string>;
    validateSignatures(userOps: UserOperationStruct[], signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
    validateUserOpSignature(userOp: UserOperationStruct, overrides?: CallOverrides): Promise<string>;
    callStatic: {
        aggregateSignatures(userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<string>;
        validateSignatures(userOps: UserOperationStruct[], signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<void>;
        validateUserOpSignature(userOp: UserOperationStruct, overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        aggregateSignatures(userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<BigNumber>;
        validateSignatures(userOps: UserOperationStruct[], signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<BigNumber>;
        validateUserOpSignature(userOp: UserOperationStruct, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        aggregateSignatures(userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<PopulatedTransaction>;
        validateSignatures(userOps: UserOperationStruct[], signature: PromiseOrValue<BytesLike>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        validateUserOpSignature(userOp: UserOperationStruct, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
